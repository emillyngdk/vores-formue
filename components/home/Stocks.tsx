"use client";

import { scaleLinear } from "d3-scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Range } from "@/components/ui/Range";
import { Ticker } from "@/components/ui/Ticker";
import { taxRules2026 } from "@/data/household";
import { type YearRow, askVsDepot } from "@/lib/engine";
import { kr, pct } from "@/lib/format";
import { useMeasure } from "@/lib/hooks";
import { useScenarioCalm } from "@/lib/scenario";

type Datum = { year: number; own: number; sale: number; gainNet: number; tax: number; gain: number; value: number; net: number; returnYear: number; inYear: number };

function build(rows: YearRow[]): Datum[] {
  const basisStart = rows[0].emil.stocksBasis + rows[0].frederikke.stocksBasis;
  return rows.map((r) => {
    const t = r.flowsTotal;
    const sale = Math.max(t.emilStocksFromSale + t.frederikkeStocksFromSale, 0);
    const value = r.emil.stocksValue + r.frederikke.stocksValue;
    const tax = r.emil.stocksTax + r.frederikke.stocksTax;
    // Det, der er taget ud til engangskøb, trækkes fra det indbetalte
    const own = Math.max(basisStart + t.emilStocksIn + t.frederikkeStocksIn + Math.min(t.emilStocksFromSale + t.frederikkeStocksFromSale, 0) + t.eventsOut + t.eventsTax, 0);
    const gain = Math.max(value - own - sale, 0);
    return {
      year: r.year, own: Math.min(own, value), sale: Math.min(sale, Math.max(value - own, 0)), gainNet: Math.max(gain - tax, 0), tax: Math.min(tax, gain), gain, value, net: value - tax,
      returnYear: r.flowsYear.emilStocksReturn + r.flowsYear.frederikkeStocksReturn,
      inYear: r.flowsYear.emilStocksIn + r.flowsYear.frederikkeStocksIn,
    };
  });
}

const PARTS = [
  { key: "own", label: "Indbetalt", color: "var(--blue)", opacity: 1 },
  { key: "sale", label: "Fra boligsalget", color: "var(--blue)", opacity: 0.55 },
  { key: "gainNet", label: "Afkast efter skat", color: "var(--mint)", opacity: 1 },
  { key: "tax", label: "Skat hvis solgt", color: "var(--coral)", opacity: 1 },
] as const;

function Bars({ data, sel, onSel }: { data: Datum[]; sel: number; onSel: (i: number) => void }) {
  const DATA = data;
  const MAX = Math.max(Math.ceil(Math.max(...data.map((d) => d.value)) / 1e6) * 1e6, 1e6);
  const [ref, width] = useMeasure<HTMLDivElement>();
  const H = 300;
  const pl = 30;
  const pb = 24;
  const y = scaleLinear().domain([0, MAX]).range([H - pb, 8]);
  const band = width ? (width - pl) / DATA.length : 0;
  const bw = Math.min(band * 0.62, 54);
  return (
    <div ref={ref} style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Aktiernes værdi år for år: indbetalt, fra boligsalget, afkast og skat">
          <defs>
            <filter id="glow" x="-50%" y="-20%" width="200%" height="140%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {Array.from({ length: MAX / 1e6 + 1 }, (_, t) => t).filter((t) => MAX <= 6e6 || t % 2 === 0).map((t) => (
            <g key={t}>
              <line x1={pl} x2={width} y1={y(t * 1e6)} y2={y(t * 1e6)} stroke="var(--line)" />
              <text x={pl - 6} y={y(t * 1e6) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">{t}</text>
            </g>
          ))}
          {DATA.map((d, i) => {
            const x = pl + band * i + (band - bw) / 2;
            let acc = 0;
            return (
              <g
                key={d.year}
                role="button"
                tabIndex={0}
                aria-label={`’${String(d.year).slice(2)}, ${d.year}: ${kr(d.net)} efter skat`}
                aria-pressed={sel === i}
                onClick={() => onSel(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSel(i))}
                style={{ cursor: "pointer", opacity: sel === i ? 1 : 0.62, transition: "opacity .25s ease" }}
              >
                <rect x={pl + band * i} y={0} width={band} height={H} fill="transparent" />
                <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} style={{ originY: 1 }}>
                  {PARTS.map((p) => {
                    const v = d[p.key];
                    const y1 = y(acc + v);
                    const h = y(acc) - y1;
                    acc += v;
                    return h > 0.4 ? (
                      <rect key={p.key} x={x} y={y1} width={bw} height={h} rx={p.key === "tax" ? 3 : 1.5} fill={p.color} fillOpacity={p.opacity} filter={p.key === "gainNet" ? "url(#glow)" : undefined} />
                    ) : null;
                  })}
                </motion.g>
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize={12} fill={sel === i ? "var(--ink)" : "var(--muted)"} fontWeight={sel === i ? 700 : 400}>
                  ’{String(d.year).slice(2)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function AskCompare() {
  const [years, setYears] = useState(9);
  const amount = 100_000;
  const r = askVsDepot(amount, 0.07, years);
  const rows = [
    { label: "Aktiesparekonto", sub: "17 % af årets afkast", v: r.ask, color: "var(--mint)" },
    { label: "Frit depot, 27 %", sub: "gevinst under 79.400 kr.", v: r.depotLow, color: "var(--blue)" },
    { label: "Frit depot, 42 %", sub: "gevinst over 79.400 kr.", v: r.depotHigh, color: "var(--coral)" },
  ];
  const cap = taxRules2026.aktiesparekonto;
  return (
    <div className="card p-6 sm:p-8">
      <h3 className="text-xl font-bold">Aktiesparekonto eller frit depot?</h3>
      <p className="mt-1 text-sm text-muted">100.000 kr. med 7 % i afkast om året. Så meget er der tilbage efter skat.</p>
      <ul className="mt-6 space-y-4">
        {rows.map((x) => (
          <li key={x.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                {x.label}
                <span className="block text-xs font-normal text-muted">{x.sub}</span>
              </span>
              <Ticker value={x.v} />
            </div>
            <div className="mt-1.5 h-3 rounded-full bg-surface-2" aria-hidden>
              <div className="h-full rounded-full" style={{ width: `${(x.v / r.gross) * 100}%`, background: x.color, transition: "width .25s ease-out" }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Range label="Antal år" value={years} min={1} max={20} step={1} onChange={setYears} display={`${years} år`} />
      </div>
      <p className="mt-4 text-sm text-muted">
        Forskellen mellem aktiesparekonto og 42 % er <span className="num text-ink">{kr(r.ask - r.depotHigh)}</span> efter {years} år. Loftet er {kr(cap.depositCap2026)} i
        2026 og {kr(cap.depositCap2027)} i 2027. Et loft på {kr(cap.proposedCap)} er foreslået, men ikke vedtaget.
      </p>
    </div>
  );
}

export function Stocks() {
  const { sim, draft } = useScenarioCalm();
  const data = useMemo(() => build(sim.rows), [sim]);
  const [sel, setSel] = useState(data.length - 1);
  const d = data[sel];
  const cross = data.find((x, i) => i > 0 && x.returnYear > x.inYear);
  return (
    <div>
      <p className="max-w-2xl text-muted sm:text-lg">
        Begge depoter samlet med {pct(draft.stockReturn, 1)} i afkast om året.
        {cross ? ` Fra ${cross.year} giver aktierne mere i afkast, end vi selv sætter ind.` : ""}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card min-w-0 p-4 sm:p-6">
          <Bars data={data} sel={sel} onSel={setSel} />
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            {PARTS.map((p) => (
              <li key={p.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color, opacity: p.opacity }} />
                {p.label}
              </li>
            ))}
            <li className="ml-auto">mio. kr.</li>
          </ul>
        </div>
        <div className="card p-6">
          <p className="eyebrow">Oktober {d.year} · efter skat</p>
          <p className="fig mt-1 text-[clamp(1.9rem,6.5vw,2.75rem)] leading-none" style={{ color: "var(--blue)" }}>
            <Ticker value={d.net} />
          </p>
          <dl className="mt-5 space-y-2 text-sm">
            {[
              ["Indbetalt i alt", d.own, "var(--ink)"],
              ["Fra boligsalget", d.sale, "var(--ink)"],
              ["Afkast", d.gain, "var(--mint)"],
              ["Skat, hvis alt blev solgt", -d.tax, "var(--coral)"],
            ].map(([k, v, c]) => (
              <div key={k as string} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd style={{ color: c as string }}>
                  <Ticker value={v as number} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">Tryk på en søjle for at se et andet år. Skatten er regnet, som om alt blev solgt det år. Sælger vi over flere år, bliver den lavere.</p>
        </div>
      </div>
      <div className="mt-4">
        <AskCompare />
      </div>
    </div>
  );
}
