import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/assistant/system";
import { TOOLS, runTool } from "@/lib/assistant/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 24;
const MAX_CHARS = 2000;

function parse(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object") return null;
  const list = (body as { messages?: unknown }).messages;
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of list) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim() || content.length > MAX_CHARS) return null;
    out.push({ role, content });
  }
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "missing_key", message: "Assistenten er ikke sat op endnu. Der mangler en ANTHROPIC_API_KEY i miljøvariablerne." }, { status: 503 });
  }
  const messages = parse(await req.json().catch(() => null));
  if (!messages) return Response.json({ error: "bad_request", message: "Beskeden kunne ikke læses." }, { status: 400 });

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
  const system = buildSystemPrompt();
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(o)}\n`));
      try {
        const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
        // Modellen må kalde værktøjer nogle gange, før den svarer
        for (let round = 0; round < 6; round++) {
          const s = client.messages.stream({ model, max_tokens: 1500, system, tools: TOOLS, messages: convo });
          s.on("text", (delta) => send({ type: "text", delta }));
          const final = await s.finalMessage();
          if (final.stop_reason !== "tool_use") break;
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== "tool_use") continue;
            const outcome = runTool(block.name, block.input);
            if (outcome.card) send({ type: "scenario", card: outcome.card });
            results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(outcome.result) });
          }
          convo.push({ role: "assistant", content: final.content }, { role: "user", content: results });
          send({ type: "text", delta: "\n\n" });
        }
        send({ type: "done" });
      } catch (err) {
        console.error("ask failed", err);
        send({ type: "error", message: "Der gik noget galt hos assistenten. Prøv igen om lidt." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
