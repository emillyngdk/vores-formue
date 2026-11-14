"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Range } from "@/components/ui/Range";
import { Ticker } from "@/components/ui/Ticker";
import { people } from "@/data/household";
import { kr, pct } from "@/lib/format";
import { useScenarioCalm } from "@/lib/scenario";

export function Pension() {
  const { sim, draft } = useScenarioCalm();
  const rows = sim.rows;
  const N = rows.length - 1;
  const [idx, setIdx] = useState(N);
  const row = rows[idx];
  const t = row.flowsTotal;
  const maxV = Math.max(rows[N].emil.pension, rows[N].frederikke.pension) * 1.06;
  const vessels = [
    { name: "Emil", v: row.emil.pension, start: rows[0].emil.pension, color: "var(--copper)", monthly: people.emil.pensionMonthly },
    { name: "Frederikke", v: row.frederikke.pension, start: rows[0].frederikke.pension, color: "var(--steel)", monthly: people.frederikke.pensionMonthly },
  ];

  return (
    <div>
      <p className="max-w-2xl text-muted sm:text-lg">
        Pensionen vokser stille og roligt i baggrunden. Den er låst til pensionsalderen og vises før skat, så den tæller ikke med i den frie formue.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Samlet pension</p>
              <p className="display mt-1 text-[clamp(2.4rem,9vw,4rem)]" style={{ color: "var(--steel)" }}>
                {row.year}
              </p>
            </div>
            <p className="pb-1 text-[clamp(1.4rem,5.5vw,2.25rem)] leading-none">
              <Ticker value={row.pension} />
            </p>
          </div>
          <div className="mt-2">
            <Range label="Vælg år" value={row.year} min={rows[0].year} max={rows[N].year} step={1} onChange={(v) => setIdx(v - rows[0].year)} display={String(row.year)} color="var(--steel)" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-8">
            {vessels.map((x) => (
              <div key={x.name}>
                <div className="relative h-48 overflow-hidden rounded-3xl border border-line bg-surface-2 sm:h-60" aria-hidden>
                  <motion.div
                    className="absolute inset-x-0 bottom-0"
                    initial={{ height: "0%" }}
                    animate={{ height: `${(x.v / maxV) * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 20 }}
                    style={{ background: `linear-gradient(to top, ${x.color}, color-mix(in srgb, ${x.color} 55%, transparent))` }}
                  />
                  <div className="absolute inset-x-0 border-t border-dashed" style={{ bottom: `${(x.start / maxV) * 100}%`, borderColor: "var(--ink)", opacity: 0.5 }} />
                  <span className="absolute left-3 text-[10px] font-semibold uppercase tracking-wider" style={{ bottom: `calc(${(x.start / maxV) * 100}% + 4px)` }}>
                    I dag
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{x.name}</p>
                <p className="text-xl sm:text-2xl">
                  <Ticker value={x.v} />
                </p>
                <p className="text-xs text-muted">{kr(x.monthly)} om måneden</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-4">
          <div className="card p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Saldo i dag</dt>
                <dd className="num">{kr(rows[0].pension)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Indbetalt fra 2026 til {row.year}</dt>
                <dd><Ticker value={t.emilPensionIn + t.frederikkePensionIn} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Afkast fra 2026 til {row.year}</dt>
                <dd style={{ color: "var(--mint)" }}><Ticker value={t.emilPensionReturn + t.frederikkePensionReturn} /></dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              Regnet med {pct(draft.pensionReturn, 1)} i afkast om året{draft.salaryGrowth === 0 ? " og uden lønstigninger" : ` og ${pct(draft.salaryGrowth, 1)} i lønstigning om året`}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
