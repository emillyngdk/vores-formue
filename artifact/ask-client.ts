import { buildSystemPrompt } from "@/lib/assistant/system";
import { TOOLS, runTool } from "@/lib/assistant/tools";
import type { AskHandlers, AskResult, ChatTurn } from "../lib/ask-client";
import type { SampleFn, SampleTool } from "./claude";

export type { AskHandlers, AskResult, ChatTurn };

const COPY: Record<string, string> = {
  not_granted: "Assistenten er ikke slået til for denne side.",
  sampling_disabled: "Claude er ikke tilgængelig for denne konto.",
  not_declared: "Assistenten er ikke slået til for denne side.",
  capability_disabled: "Assistenten kan ikke bruges i denne visning.",
  capability_removed: "Assistenten kan ikke bruges i denne visning.",
  rate_limited: "Der er spurgt for meget lige nu. Prøv igen om lidt.",
  session_expired: "Du skal logge ind i Claude igen.",
  refused: "Det spørgsmål kan assistenten ikke svare på. Prøv at formulere det anderledes.",
  empty_completion: "Assistenten gav ikke noget svar. Prøv at spørge lidt enklere.",
  prompt_too_large: "Samtalen er blevet for lang. Genindlæs siden, og start forfra.",
  upstream_error: "Forbindelsen til assistenten blev afbrudt. Prøv igen.",
};

/** Spørger Claude gennem artifactens egen adgang. Regnemotoren stilles til rådighed som værktøjer, der kører her i siden. */
export async function askAssistant(history: ChatTurn[], h: AskHandlers): Promise<AskResult> {
  const sample = ((await window.claude?.use("sample").catch(() => null)) ?? null) as SampleFn | null;
  if (!sample) return { ok: false, message: "Assistenten er ikke tilgængelig i denne visning." };

  const limits = await sample.limits().catch(() => null);
  const max = limits?.tools?.maxCount ?? 0;
  const tools: SampleTool[] = TOOLS.slice(0, max).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.input_schema,
    execute: (input) => {
      const outcome = runTool(t.name, input);
      if (outcome.card) h.onCard(outcome.card);
      return outcome.result;
    },
  }));
  const rules =
    buildSystemPrompt() +
    (tools.length
      ? ""
      : "\n\nVærktøjerne er ikke tilgængelige i denne visning. Svar kun ud fra tallene ovenfor, og sig ærligt, hvis et spørgsmål kræver en ny beregning.");

  try {
    await sample([{ role: "user", content: rules }, ...history], {
      cache: false,
      signal: h.signal,
      onText: ({ text }) => {
        const whole = text.replace(/^\s+/, "");
        if (whole) h.onText(whole);
      },
      ...(tools.length ? { tools } : {}),
    });
    return { ok: true };
  } catch (e) {
    const code = (e as { code?: string } | null)?.code ?? "upstream_error";
    if (code === "cancelled") return { ok: false, message: "", cancelled: true };
    return { ok: false, message: COPY[code] ?? COPY.upstream_error, clear: code === "refused" };
  }
}
