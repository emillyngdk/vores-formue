"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Delta } from "@/components/ui/Delta";
import { Ticker } from "@/components/ui/Ticker";
import { people } from "@/data/household";
import { CATEGORIES, parts } from "@/lib/base";
import { useScenario } from "@/lib/scenario";
import { WealthLine } from "./WealthLine";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const PEOPLE = [
  { key: "emil" as const, name: people.emil.name, color: "var(--violet)" },
  { key: "frederikke" as const, name: people.frederikke.name, color: "var(--sky)" },
];

/** Forsiden: formuen i dag, formuen i 2035 og vejen derhen. Regner om, når en antagelse ændres. */
export function Hero() {
  const { sim, planSim, changed, delta, deltaNow } = useScenario();
  const first = sim.rows[0];
  const end = sim.rows[sim.rows.length - 1];
  const planEnd = planSim.rows[planSim.rows.length - 1];
  const now = parts(first);
  const then = parts(end);
  const scale = Math.max(...then, ...parts(planEnd), 1);

  const growth = end.wealthWithPension - first.wealthWithPension;
  const yearly = (end.wealthWithPension / first.wealthWithPension) ** (1 / (sim.rows.length - 1)) - 1;

  return (
    <section aria-labelledby="hero-title" className="hero-glow">
      <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-12">
        <p className="eyebrow">Emil og Frederikke · tal pr. oktober 2026</p>
        <h1 id="hero-title" className="display mt-3 text-[clamp(2rem,8.6vw,5.25rem)] leading-[1.06]">
          På kistebunden
        </h1>

        {/* Tre tal på én linje: i dag, 2035 og væksten imellem */}
        <dl className="mt-6 grid grid-cols-2 border-y border-line sm:mt-8 sm:grid-cols-3">
          <div className="min-w-0 py-4 pr-4 sm:py-5 sm:pr-6">
            <dt className="eyebrow">I dag</dt>
            <dd className="mt-1.5 text-[clamp(1.3rem,5.4vw,2.6rem)] leading-none">
              <Ticker value={first.wealthWithPension} countUp />
            </dd>
            <dd className="mt-1.5 text-xs text-muted sm:text-sm">
              uden pension <Ticker value={first.wealth} className="text-ink" />
            </dd>
            {changed && Math.abs(deltaNow) >= 500 && (
              <dd className="mt-2">
                <Delta v={deltaNow} suffix="mod planen" />
              </dd>
            )}
          </div>
          <div className="min-w-0 border-l border-line py-4 pl-4 sm:px-6 sm:py-5">
            <dt className="eyebrow" style={{ color: "var(--accent-text)" }}>
              Oktober 2035
            </dt>
            <dd className="mt-1.5 text-[clamp(1.3rem,5.4vw,2.6rem)] leading-none" style={{ color: "var(--accent-text)" }}>
              <Ticker value={end.wealthWithPension} countUp />
            </dd>
            <dd className="mt-1.5 text-xs text-muted sm:text-sm">
              uden pension <Ticker value={end.wealth} className="text-ink" />
            </dd>
            {changed && (
              <dd className="mt-2">
                <Delta v={delta} suffix="mod planen" />
              </dd>
            )}
          </div>
          <div className="col-span-2 min-w-0 border-t border-line py-4 sm:col-span-1 sm:border-l sm:border-t-0 sm:py-5 sm:pl-6">
            <dt className="eyebrow">Vækst frem til 2035</dt>
            <dd className="mt-1.5 text-[clamp(1.3rem,5.4vw,2.6rem)] leading-none" style={{ color: "var(--mint)" }}>
              <Ticker value={growth} kind="signedKr" />
            </dd>
            <dd className="mt-1.5 text-xs text-muted sm:text-sm">
              ca. <Ticker value={yearly} kind="pct" className="text-ink" /> om året, med pension
            </dd>
          </div>
        </dl>

        {/* Hver for sig: et tryk viser, hvordan formuen er opgjort */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4">
          {PEOPLE.map((x) => {
            const r = first[x.key];
            return (
              <Link key={x.key} href={`/${x.key}`} className="card group flex min-w-0 flex-col p-4 sm:p-5" aria-label={`${x.name}: se hvordan formuen er opgjort`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: x.color }} aria-hidden />
                    <span className="truncate">{x.name}</span>
                  </span>
                  <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
                <span className="mt-2 text-[clamp(1.05rem,4.6vw,1.75rem)] leading-none">
                  <Ticker value={r.wealthWithPension} />
                </span>
                <span className="mt-1.5 text-xs text-muted">
                  uden pension <Ticker value={r.wealth} className="text-ink" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 min-w-0 sm:mt-8">
          <WealthLine />
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 lg:grid-cols-4 lg:gap-4">
          {CATEGORIES.map((c, i) => (
            <motion.li
              key={c.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: EASE }}
              className="card min-w-0 p-4 sm:p-5"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} aria-hidden />
                {c.label}
              </p>
              <p className="mt-2 text-[clamp(1.15rem,4.6vw,1.75rem)] leading-none">
                <Ticker value={then[i]} kind="mio" />
              </p>
              <p className="mt-1.5 text-xs text-muted">
                i 2035 · i dag <Ticker value={now[i]} kind="mioShort" className="!font-normal" />
              </p>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max((then[i] / scale) * 100, 0)}%`, background: c.color, opacity: 0.4, transition: "width .45s cubic-bezier(.22,1,.36,1)" }} />
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max((now[i] / scale) * 100, 0)}%`, background: c.color, transition: "width .45s cubic-bezier(.22,1,.36,1)" }} />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
