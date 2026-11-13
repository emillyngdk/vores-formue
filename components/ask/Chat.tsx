"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ScenarioCard } from "@/lib/assistant/tools";
import { askAssistant } from "@/lib/ask-client";
import { mio, signedKr } from "@/lib/format";

type Msg = { role: "user" | "assistant"; content: string; cards?: ScenarioCard[]; error?: boolean };

const CHIPS = [
  "Hvad betyder Nykredits 11,5 % for os?",
  "Skal vi fylde aktiesparekontoen op?",
  "Hvad hvis vi sælger for 7,4 mio. og huset koster 6,9?",
  "Hvad koster det os at købe en bil til 350.000 kr. i 2029?",
  "Hvad hvis aktierne kun giver 4 %?",
];

function Card({ c }: { c: ScenarioCard }) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-4">
      <p className="eyebrow">Scenarie · med pension · forskel mod basis</p>
      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
        {[
          ["2031", c.y2031, c.d2031],
          ["2035", c.y2035, c.d2035],
        ].map(([y, v, d]) => (
          <div key={y as string}>
            <dt className="text-muted">{y}</dt>
            <dd className="num text-lg">{mio(v as number)}</dd>
            <dd className="num text-xs" style={{ color: (d as number) >= 0 ? "var(--mint)" : "var(--coral)" }}>
              {signedKr(d as number)}
            </dd>
          </div>
        ))}
      </dl>
      <Link href={`/lab?${c.query}`} className="mt-3 inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold">
        Åbn i lab
      </Link>
    </div>
  );
}

export function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (msgs.length) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs]);
  useEffect(() => () => abort.current?.abort(), []);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs.filter((m) => !m.error), { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const patch = (fn: (m: Msg) => Msg) => setMsgs((all) => all.map((m, i) => (i === all.length - 1 ? fn(m) : m)));
    abort.current = new AbortController();
    const res = await askAssistant(
      history.slice(-20).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
      {
        signal: abort.current.signal,
        onText: (whole) => patch((m) => ({ ...m, content: whole })),
        onCard: (card) => patch((m) => ({ ...m, cards: [...(m.cards ?? []), card].slice(-2) })),
      },
    );
    if (!res.ok) {
      if (res.cancelled) patch((m) => (m.content ? m : { ...m, content: "Stoppet.", error: true }));
      else patch((m) => ({ ...m, content: res.clear ? res.message : m.content || res.message, cards: res.clear ? undefined : m.cards, error: res.clear || !m.content }));
    }
    setBusy(false);
  }

  const empty = msgs.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-nav)-var(--bottom-nav)-4rem)] max-w-3xl flex-col px-4 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Spørg Claude</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,4.5rem)]">Spørg om vores økonomi</h1>
      {empty && (
        <>
          <p className="mt-3 max-w-xl text-muted sm:text-lg">
            Stil et spørgsmål på almindeligt dansk. Assistenten kender vores tal og regner scenarier med den samme regnemotor som resten af siden.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => ask(c)} className="chip min-h-11 text-left">
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ol className="mt-6 flex-1 space-y-4" aria-live="polite">
        {msgs.map((m, i) => (
          <li key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "user" ? (
              <p className="max-w-[85%] rounded-3xl rounded-br-lg px-5 py-3 font-medium" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
                {m.content}
              </p>
            ) : (
              <div className="card max-w-[92%] rounded-bl-lg p-5" style={m.error ? { borderColor: "var(--coral)" } : undefined}>
                {m.content ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                ) : (
                  <p className="flex items-center gap-2 text-muted">
                    <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent)" }} />
                    Regner
                  </p>
                )}
                {m.cards?.map((c, ci) => <Card key={ci} c={c} />)}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div ref={endRef} />

      <form
        className="glass sticky bottom-[var(--bottom-nav)] -mx-4 mt-6 flex items-end gap-2 border-t border-line px-4 py-3 sm:mx-0 sm:rounded-3xl sm:border sm:px-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Dit spørgsmål
        </label>
        <textarea
          id="ask-input"
          rows={1}
          value={input}
          maxLength={2000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          placeholder="Skriv et spørgsmål"
          className="max-h-40 min-h-12 flex-1 resize-none rounded-3xl border border-line bg-surface px-5 py-3 text-base"
        />
        {busy ? (
          <button type="button" onClick={() => abort.current?.abort()} className="min-h-12 rounded-full border border-line bg-surface px-6 font-semibold">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="cta min-h-12 px-6 disabled:opacity-50">
            Send
          </button>
        )}
      </form>
      <p className="py-3 text-center text-xs text-muted">Svarene er ikke rådgivning. Kun samlede tal sendes til assistenten, ingen CPR-numre eller kontonumre.</p>
    </div>
  );
}
