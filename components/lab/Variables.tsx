"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Delta } from "@/components/ui/Delta";
import { Range } from "@/components/ui/Range";
import { Segmented } from "@/components/ui/Segmented";
import { Ticker } from "@/components/ui/Ticker";
import { EventFields } from "@/components/whatif/EventFields";
import { loans } from "@/data/household";
import { effectiveCut } from "@/lib/engine";
import { kr } from "@/lib/format";
import { useScenario } from "@/lib/scenario";
import { GROUPS, type Group, changedCount, changedIn } from "@/lib/variables";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function GroupCard({ g, open, toggle }: { g: Group; open: boolean; toggle: () => void }) {
  const sc = useScenario();
  const { draft: d, plan } = sc;
  const n = changedIn(g, d, plan);
  const saleYear = 2026 + d.saleMonth / 12;
  const events = d.events ?? [];

  return (
    <div className="card mb-4 break-inside-avoid overflow-hidden">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-5 py-4 text-left sm:px-6">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold">{g.title}</span>
            {n > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
                {n} ændret
              </span>
            )}
          </span>
          <span className="block text-sm text-muted">{g.sub}</span>
        </span>
        <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <div className="space-y-6 border-t border-line px-5 pb-6 pt-5 sm:px-6">
              {g.special?.includes("saleYear") && (
                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Hvornår flytter vi? <span className="font-normal text-muted">I oktober</span>
                  </p>
                  <Segmented options={[2027, 2028, 2029, 2030].map((y) => ({ value: y, label: String(y) }))} value={saleYear} onChange={(y) => sc.set("saleMonth", (y - 2026) * 12)} label="Salgsår" size="sm" />
                  {d.saleMonth !== plan.saleMonth && (
                    <button type="button" onClick={() => sc.set("saleMonth", plan.saleMonth)} className="mt-1 min-h-11 text-xs font-semibold underline underline-offset-4" style={{ color: "var(--accent-text)" }}>
                      Tilbage til planen ({2026 + plan.saleMonth / 12})
                    </button>
                  )}
                </div>
              )}
              {g.fields.map((f) => (
                <Range
                  key={f.key}
                  label={f.label}
                  value={d[f.key]}
                  min={Math.min(f.min, d[f.key])}
                  max={Math.max(f.max, d[f.key])}
                  step={f.step}
                  nudge={f.nudge}
                  onChange={(v) => sc.set(f.key, v)}
                  display={f.fmt(d[f.key])}
                  color={f.color}
                  hint={f.key === "nordnetCutAfterMove" && effectiveCut(d) !== d.nordnetCutAfterMove ? `${f.hint} Med jeres hus og rente bliver det ${kr(effectiveCut(d))} pr. person.` : f.hint}
                  plan={{ value: plan[f.key], display: f.fmt(plan[f.key]), onReset: () => sc.set(f.key, plan[f.key]) }}
                />
              ))}
              {g.special?.includes("suToNordnet") && (
                <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
                  <span className="text-sm font-semibold">
                    SU-pengene til Nordnet, når lånet er betalt
                    <span className="block text-xs font-normal text-muted">{kr(loans.suLoan.monthly)} om måneden fra Frederikke.</span>
                  </span>
                  <input type="checkbox" role="switch" checked={d.suToNordnet} onChange={(e) => sc.set("suToNordnet", e.target.checked)} className="h-6 w-6 shrink-0" style={{ accentColor: "var(--accent)" }} />
                </label>
              )}
              {g.special?.includes("events") && (
                <div className="space-y-3">
                  {events.length === 0 && <p className="text-sm text-muted">Læg fx en bil ind og se, hvad den koster i formue. Købet regnes som en ren udgift.</p>}
                  {events.map((e) => (
                    <details key={e.id} className="rounded-2xl bg-surface-2" open={events.length === 1}>
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold">
                        <span style={e.on ? undefined : { textDecoration: "line-through", opacity: 0.6 }}>
                          {e.label || "Køb"} · januar {e.year}
                        </span>
                        <span className="num">{kr(e.amount)}</span>
                      </summary>
                      <div className="border-t border-line p-4">
                        <EventFields event={e} />
                      </div>
                    </details>
                  ))}
                  {events.length < 6 && (
                    <button type="button" onClick={() => sc.addEvent()} className="min-h-11 rounded-full border border-dashed border-line px-5 text-sm font-semibold">
                      ＋ Tilføj køb
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Alle variabler samlet ét sted. Ændringer gælder også forsiden, indtil de gemmes som plan eller nulstilles. */
export function Variables({ year, withPension }: { year: number; withPension: boolean }) {
  const sc = useScenario();
  const [open, setOpen] = useState<Set<string>>(() => new Set(["afkast", "laan"]));
  const [saved, setSaved] = useState(false);
  const i = year - 2026;
  const pick = (r: (typeof sc.sim.rows)[number]) => (withPension ? r.wealthWithPension : r.wealth);
  const v = pick(sc.sim.rows[i]);
  const delta = v - pick(sc.planSim.rows[i]);
  const n = changedCount(sc.draft, sc.plan);
  const allOpen = open.size === GROUPS.length;

  return (
    <section id="variabler" aria-labelledby="variabler-title" className="scroll-mt-24 pt-14 sm:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="variabler-title" className="display text-[clamp(1.6rem,5vw,2.75rem)]">
            Alle variabler
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">Renter, løn, pension, skat og bolighandlen. Alt, der påvirker formuen, kan rettes her.</p>
        </div>
        <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(GROUPS.map((g) => g.id)))} className="min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
          {allOpen ? "Fold alle sammen" : "Fold alle ud"}
        </button>
      </div>

      {/* Resultatet følger med, mens man retter */}
      <div className="glass sticky top-[var(--top-nav)] z-20 -mx-4 mt-5 border-y border-line px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-xs text-muted">
              Formue {year}, {withPension ? "med" : "uden"} pension
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2 leading-tight">
              <Ticker value={v} className="text-lg sm:text-xl" />
              {sc.changed && <Delta v={delta} same="som planen" />}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2" aria-live="polite">
            {saved && !sc.changed ? (
              <span className="text-sm font-semibold" style={{ color: "var(--mint)" }}>
                Gemt som jeres plan
              </span>
            ) : sc.changed ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">{n} ændret</span>
                <button type="button" onClick={sc.reset} className="min-h-11 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold">
                  Nulstil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sc.savePlan();
                    setSaved(true);
                  }}
                  className="cta min-h-11 px-4 text-[13px]"
                >
                  Gem som plan
                </button>
              </>
            ) : (
              <span className="text-sm text-muted">Som planen</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 lg:columns-2 lg:gap-4">
        {GROUPS.map((g) => (
          <GroupCard
            key={g.id}
            g={g}
            open={open.has(g.id)}
            toggle={() =>
              setOpen((o) => {
                const next = new Set(o);
                if (next.has(g.id)) next.delete(g.id);
                else next.add(g.id);
                return next;
              })
            }
          />
        ))}
      </div>
      {!sc.planIsOriginal && !sc.changed && (
        <button type="button" onClick={sc.restoreOriginal} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold">
          Tilbage til den oprindelige plan
        </button>
      )}
    </section>
  );
}
