import type { ScenarioCard } from "@/lib/assistant/tools";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface AskHandlers {
  /** Hele svaret indtil nu */
  onText(whole: string): void;
  /** Et scenarie, assistenten har regnet */
  onCard(card: ScenarioCard): void;
  signal: AbortSignal;
}

/** `clear`: det, der allerede er vist, skal fjernes (svaret er trukket tilbage) */
export type AskResult = { ok: true } | { ok: false; message: string; cancelled?: boolean; clear?: boolean };

/** Spørger assistenten via sidens egen server (/api/ask) og læser svaret, mens det skrives. */
export async function askAssistant(history: ChatTurn[], h: AskHandlers): Promise<AskResult> {
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal: h.signal,
    });
    if (!res.ok || !res.body) {
      const j = (await res.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, message: j?.message ?? "Assistenten svarer ikke lige nu. Prøv igen om lidt." };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let whole = "";
    let failed: string | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const ev = JSON.parse(line) as { type: string; delta?: string; card?: ScenarioCard; message?: string };
        if (ev.type === "text" && ev.delta) {
          whole = (whole + ev.delta).replace(/^\s+/, "");
          if (whole) h.onText(whole);
        } else if (ev.type === "scenario" && ev.card) h.onCard(ev.card);
        else if (ev.type === "error") failed = ev.message ?? "Der gik noget galt.";
      }
    }
    return failed ? { ok: false, message: failed } : { ok: true };
  } catch {
    if (h.signal.aborted) return { ok: false, message: "", cancelled: true };
    return { ok: false, message: "Forbindelsen blev afbrudt. Prøv igen." };
  }
}
