"use client";

import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useMemo, useState } from "react";
import { kr, signedKr } from "@/lib/format";
import { useLocalStorage, useMeasure } from "@/lib/hooks";
import { useScenario } from "@/lib/scenario";

type Entry = { month: string; emilStocks: number; frederikkeStocks: number; prioritetsKonto: number; emilPension: number; frederikkePension: number };

const FIELDS = [
  { key: "emilStocks", label: "Nordnet, Emil" },
  { key: "frederikkeStocks", label: "Nordnet, Frederikke" },
  { key: "prioritetsKonto", label: "PrioritetsKonto" },
  { key: "emilPension", label: "Pension, Emil" },
  { key: "frederikkePension", label: "Pension, Frederikke" },
] as const;

const sumOf = (o: Record<(typeof FIELDS)[number]["key"], number>) => FIELDS.reduce((s, f) => s + o[f.key], 0);
const monthIndex = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return (y - 2026) * 12 + (m - 10);
};
const label = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString("da-DK", { month: "long", year: "numeric" });

function Chart({ entries, PLAN }: { entries: (Entry & { m: number; total: number })[]; PLAN: number[] }) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const H = 220;
  const lastM = Math.min(108, Math.max(12, ...entries.map((e) => e.m + 6)));
  const plan = PLAN.slice(0, lastM + 1);
  const all = [...plan, ...entries.map((e) => e.total)];
  const lo = Math.min(...all) * 0.97;
  const hi = Math.max(...all) * 1.03;
  const x = scaleLinear().domain([0, lastM]).range([8, Math.max(width - 8, 9)]);
  const y = scaleLinear().domain([lo, hi]).range([H - 22, 8]);
  const pl = line<number>().x((_, i) => x(i)).y((d) => y(d));
  const al = line<{ m: number; total: number }>().x((d) => x(d.m)).y((d) => y(d.total));
  return (
    <div ref={ref} style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Plan og faktiske tal måned for måned">
          <path d={pl(plan) ?? ""} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 6" />
          <path d={al(entries) ?? ""} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {entries.map((e) => (
            <circle key={e.month} cx={x(e.m)} cy={y(e.total)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          ))}
          <text x={8} y={H - 5} fontSize={12} fill="var(--muted)">okt. 2026</text>
          <text x={width - 8} y={H - 5} fontSize={12} fill="var(--muted)" textAnchor="end">{lastM} mdr. frem</text>
        </svg>
      )}
    </div>
  );
}

export function CheckIn() {
  // Planen er den, der er gemt på forsiden. Er intet gemt, er det den oprindelige.
  const { planSim } = useScenario();
  const PLAN = useMemo(() => planSim.monthly.map((p) => sumOf(p)), [planSim]);
  const [entries, setEntries, loaded, shared] = useLocalStorage<Entry[]>("vf-checkins", []);
  const [month, setMonth] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      entries
        .map((e) => ({ ...e, m: monthIndex(e.month), total: sumOf(e) }))
        .filter((e) => e.m >= 0 && e.m <= 108)
        .sort((a, b) => a.m - b.m),
    [entries],
  );
  const latest = rows[rows.length - 1];
  const diff = latest ? latest.total - PLAN[latest.m] : 0;
  const rel = latest ? diff / PLAN[latest.m] : 0;
  const status = !latest ? null : rel > 0.01 ? { t: "Foran planen", c: "var(--mint)" } : rel < -0.01 ? { t: "Bagud", c: "var(--coral)" } : { t: "På sporet", c: "var(--accent-text)" };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = month ? monthIndex(month) : NaN;
    if (!(m >= 0 && m <= 108)) return setError("Vælg en måned mellem oktober 2026 og oktober 2035.");
    const parsed: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number((vals[f.key] ?? "").replace(/[.\s]/g, "").replace(",", "."));
      if (!(vals[f.key] ?? "").trim() || !Number.isFinite(n) || n < 0) return setError(`Skriv et beløb for ${f.label}.`);
      parsed[f.key] = n;
    }
    setError("");
    setEntries([...entries.filter((x) => x.month !== month), { month, ...(parsed as Omit<Entry, "month">) }]);
    setVals({});
  };

  return (
    <>
      {status && latest ? (
        <div className="card mt-8 p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Seneste check-in · {label(latest.month)}</p>
              <p className="display mt-2 text-[clamp(1.8rem,7vw,3rem)]" style={{ color: status.c }}>{status.t}</p>
            </div>
            <p className="text-right text-sm text-muted">
              Faktisk <span className="num text-ink">{kr(latest.total)}</span>
              <br />
              Plan <span className="num text-ink">{kr(PLAN[latest.m])}</span> · <span className="num" style={{ color: status.c }}>{signedKr(diff)}</span>
            </p>
          </div>
          <div className="mt-4"><Chart entries={rows} PLAN={PLAN} /></div>
          <p className="mt-2 text-xs text-muted">Stiplet linje er planen, den fulde linje er jeres egne tal. Tallene dækker Nordnet før skat, PrioritetsKonto og pension.</p>
        </div>
      ) : (
        <div className="card mt-8 p-6 text-muted">
          {loaded ? "Ingen check-ins endnu. Skriv månedens saldi herunder, så viser siden, om I er foran eller bagud i forhold til planen." : " "}
        </div>
      )}

      <form onSubmit={submit} className="card mt-4 p-5 sm:p-8" noValidate>
        <h2 className="text-xl font-bold">Ny check-in</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ci-month" className="text-sm font-semibold">Måned</label>
            <input id="ci-month" type="month" min="2026-10" max="2035-10" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 sm:max-w-xs" />
          </div>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`ci-${f.key}`} className="text-sm font-semibold">{f.label}</label>
              <div className="relative mt-1">
                <input id={`ci-${f.key}`} inputMode="numeric" autoComplete="off" value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="num block min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 pr-12" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">kr.</span>
              </div>
            </div>
          ))}
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-semibold" style={{ color: "var(--coral)" }}>{error}</p>}
        <button type="submit" className="cta mt-6 min-h-12 px-7">Gem check-in</button>
        <p className="mt-3 text-xs text-muted">{shared ? "Check-ins ligger på siden, så I begge kan se dem." : "Gemmes kun på denne enhed, ikke på en server."}</p>
      </form>

      {rows.length > 0 && (
        <ul className="mt-4 space-y-2">
          {[...rows].reverse().map((r) => (
            <li key={r.month} className="card flex items-center justify-between gap-3 px-5 py-3">
              <span className="font-semibold first-letter:uppercase">{label(r.month)}</span>
              <span className="flex items-center gap-3">
                <span className="num text-sm">{kr(r.total)}</span>
                <button type="button" onClick={() => setEntries(entries.filter((e) => e.month !== r.month))} aria-label={`Slet check-in for ${label(r.month)}`} className="min-h-10 rounded-full border border-line px-3 text-sm text-muted">Slet</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
