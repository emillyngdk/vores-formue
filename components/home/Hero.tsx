"use client";

import { motion } from "motion/react";
import { Delta } from "@/components/ui/Delta";
import { Ticker } from "@/components/ui/Ticker";
import { CATEGORIES, parts } from "@/lib/base";
import { useScenario } from "@/lib/scenario";
import { WealthLine } from "./WealthLine";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Forsiden: formuen i dag, formuen i 2035 og vejen derhen. Regner om, når en antagelse ændres. */
export function Hero() {
  const { sim, planSim, changed, delta, deltaNow } = useScenario();
  const first = sim.rows[0];
  const end = sim.rows[sim.rows.length - 1];
  const planEnd = planSim.rows[planSim.rows.length - 1];
  const now = parts(first);
  const then = parts(end);
  const scale = Math.max(...then, ...parts(planEnd), 1);

  return (
    <section aria-labelledby="hero-title" className="hero-glow">
      <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="grid grid-cols-1 items-end gap-x-12 gap-y-5 lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="eyebrow">Emil og Frederikke · tal pr. oktober 2026</p>
            <h1 id="hero-title" className="display mt-2 text-[clamp(2.3rem,10vw,6rem)]">
              Vores formue
            </h1>
          </div>

          <dl className="grid min-w-0 grid-cols-2 gap-x-4 lg:gap-x-14 lg:pb-2">
              <div className="min-w-0">
                <dt className="eyebrow">I dag</dt>
                <dd className="mt-1 text-[clamp(1.2rem,5.6vw,2.75rem)] leading-none">
                  <Ticker value={first.wealthWithPension} countUp />
                </dd>
                <dd className="mt-1.5 text-xs text-muted sm:text-sm">
                  uden pension <Ticker value={first.wealth} className="text-ink" />
                </dd>
                <dd className="mt-2 h-6" aria-live="polite">
                  {changed && Math.abs(deltaNow) >= 500 && <Delta v={deltaNow} suffix="mod planen" />}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="eyebrow" style={{ color: "var(--accent-text)" }}>
                  Oktober 2035
                </dt>
                <dd className="mt-1 text-[clamp(1.2rem,5.6vw,2.75rem)] leading-none" style={{ color: "var(--accent-text)" }}>
                  <Ticker value={end.wealthWithPension} countUp />
                </dd>
                <dd className="mt-1.5 text-xs text-muted sm:text-sm">
                  uden pension <Ticker value={end.wealth} className="text-ink" />
                </dd>
                {/* Pladsen er der altid, så siden ikke hopper, når noget ændres */}
                <dd className="mt-2 h-6" aria-live="polite">
                  {changed && <Delta v={delta} suffix="mod planen" />}
                </dd>
              </div>
          </dl>
        </div>

        <div className="mt-5 min-w-0 lg:mt-8">
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
