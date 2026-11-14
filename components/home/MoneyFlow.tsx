"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Chapter } from "@/components/ui/Chapter";
import { Ticker } from "@/components/ui/Ticker";
import { child, monthlyFlow, people, snapshot } from "@/data/household";
import { prioritetslaanCost } from "@/lib/engine";
import { kr } from "@/lib/format";

type Line = { label: string; value: number; who?: "Emil" | "Frederikke" };
type Bucket = { id: string; label: string; sub: string; color: string; onColor: string; lines: Line[]; note?: string; total: number };

const sum = (xs: readonly { monthly: number | null }[]) => xs.reduce((a, x) => a + (x.monthly ?? 0), 0);
const pay = (label: string) => monthlyFlow.prioritetsKontoPays.find((p) => p.label === label)?.monthly ?? 0;

const fixedE = sum(monthlyFlow.personalFixed.emil);
const fixedF = sum(monthlyFlow.personalFixed.frederikke);
const toPrio = monthlyFlow.perPerson.toPrioritetsKonto + monthlyFlow.perPerson.savingsToPrioritetsKonto;
const axel = monthlyFlow.perPerson.axelKonto;
const restE = people.emil.netMonthly - toPrio - monthlyFlow.nordnet.emil - axel - fixedE;
const restF = people.frederikke.netMonthly - toPrio - monthlyFlow.nordnet.frederikke - axel - fixedF;
const prioIn = toPrio * 2 + child.boernepengeMonthly;
const prioLoan = Math.round(prioritetslaanCost(snapshot.shared.prioritetsKonto).monthly);
const smallBills = pay("El") + pay("Indboforsikring") + pay("Bilforsikring") + pay("Gebyrer");

const bills: Line[] = [
  { label: "Totalkredit", value: pay("Totalkredit") },
  { label: "Vuggestue", value: pay("Vuggestue") },
  { label: "Ejerforening", value: pay("Ejerforening") },
  { label: "Forsikring, el og gebyrer", value: smallBills },
  { label: "Rente på prioritetslånet", value: prioLoan },
  { label: "Madkonto", value: pay("Madkonto") },
  { label: "Energilån", value: pay("Energilån") },
];
const billsTotal = bills.reduce((a, l) => a + l.value, 0);
const buffer = prioIn - billsTotal;
const INCOME = people.emil.netMonthly + people.frederikke.netMonthly + child.boernepengeMonthly;
const pension = people.emil.pensionMonthly + people.frederikke.pensionMonthly;

const make = (b: Omit<Bucket, "total">): Bucket => ({ ...b, total: b.lines.reduce((a, l) => a + l.value, 0) });
const BUCKETS: Bucket[] = [
  make({
    id: "regninger", label: "Fælles regninger", sub: "Betales fra PrioritetsKontoen", color: "var(--accent)", onColor: "var(--on-accent)",
    lines: bills,
  }),
  make({
    id: "opsparing", label: "Opsparing", sub: "Nordnet, buffer og Axel", color: "var(--mint)", onColor: "var(--on-fill)",
    lines: [
      { label: "Nordnet", value: monthlyFlow.nordnet.frederikke, who: "Frederikke" },
      { label: "Nordnet", value: monthlyFlow.nordnet.emil, who: "Emil" },
      { label: "Buffer på PrioritetsKontoen", value: buffer },
      { label: "Axels konto", value: axel * 2 },
    ],
    note: `Pensionen på ${kr(pension)} om måneden trækkes, før lønnen udbetales, og er ikke med her.`,
  }),
  make({
    id: "egne", label: "Egne faste udgifter", sub: "A-kasse, billån, abonnementer", color: "var(--caramel)", onColor: "var(--on-fill)",
    lines: [
      ...monthlyFlow.personalFixed.frederikke.map((l) => ({ label: l.label, value: l.monthly, who: "Frederikke" as const })),
      ...monthlyFlow.personalFixed.emil.map((l) => ({ label: l.label, value: l.monthly, who: "Emil" as const })),
    ].sort((a, b) => b.value - a.value),
  }),
  make({
    id: "rest", label: "Mad, privat og resten", sub: "Det, der er tilbage på lønkontoen", color: "var(--choc)", onColor: "var(--on-fill)",
    lines: [
      { label: "Til rådighed", value: restF, who: "Frederikke" },
      { label: "Til rådighed", value: restE, who: "Emil" },
    ],
  }),
];

const SOURCES = [
  { label: "Emils løn", value: people.emil.netMonthly },
  { label: "Frederikkes løn", value: people.frederikke.netMonthly },
  { label: "Børnepenge", value: child.boernepengeMonthly },
];

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const share = (v: number) => `${Math.round((v / INCOME) * 100)} %`;

function Detail({ b }: { b: Bucket }) {
  const top = Math.max(...b.lines.map((l) => l.value));
  return (
    <div>
      <ul className="space-y-3">
        {b.lines.map((l, i) => (
          <li key={`${l.label}-${l.who ?? i}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                {l.label}
                {l.who && <span className="text-muted"> · {l.who}</span>}
              </span>
              <span className="num">{kr(l.value)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <motion.div
                className="h-full rounded-full"
                style={{ background: b.color, originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: l.value / top }}
                transition={{ duration: 0.5, delay: 0.04 * i, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ul>
      {b.note && <p className="mt-4 text-xs text-muted">{b.note}</p>}
    </div>
  );
}

/** Én måneds løn som én bjælke: fire bunker, og et tryk viser, hvad der ligger i hver. */
export function MoneyFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [sel, setSel] = useState<string | null>("regninger");
  const active = BUCKETS.find((b) => b.id === sel) ?? null;

  return (
    <Chapter
      id="pengestroem"
      no="01"
      kicker="En normal måned"
      title="Pengestrømmen"
      intro="Lønnen og børnepengene ender i fire bunker hver måned. Tryk på en bunke for at se, hvad der ligger i den."
    >
      <div ref={ref} className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="card min-w-0 p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="eyebrow">Ind hver måned</p>
              <p className="fig mt-1 text-[clamp(2rem,8vw,3.5rem)] leading-none">
                <Ticker value={INCOME} countUp />
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
              {SOURCES.map((s) => (
                <li key={s.label}>
                  {s.label} <span className="num text-ink">{kr(s.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bjælken: hele lønnen delt i fire */}
          <div className="mt-6 flex h-14 gap-1 sm:h-16" role="group" aria-label="Lønnen delt i fire bunker">
            {BUCKETS.map((b, i) => {
              const on = sel === b.id;
              return (
                <motion.button
                  key={b.id}
                  type="button"
                  onClick={() => setSel(b.id)}
                  aria-pressed={on}
                  aria-label={`${b.label}: ${kr(b.total)}, ${share(b.total)}`}
                  className="relative min-w-0 overflow-hidden rounded-xl text-left first:rounded-l-2xl last:rounded-r-2xl"
                  style={{ flexGrow: b.total, flexBasis: 0, background: b.color, color: b.onColor, originX: 0, boxShadow: on ? "inset 0 0 0 3px var(--ink)" : "inset 0 0 0 0 var(--ink)", transition: "box-shadow .2s ease" }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={seen ? { scaleX: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.16, ease: EASE }}
                >
                  <span className="num absolute inset-0 grid place-items-center text-xs sm:text-sm">{share(b.total)}</span>
                </motion.button>
              );
            })}
          </div>

          <ul className="mt-4 divide-y divide-line">
            {BUCKETS.map((b, i) => {
              const on = sel === b.id;
              return (
                <motion.li key={b.id} initial={{ opacity: 0, y: 10 }} animate={seen ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.45, delay: 0.3 + i * 0.16, ease: EASE }}>
                  <button
                    type="button"
                    onClick={() => setSel(on ? null : b.id)}
                    aria-expanded={on}
                    className="flex min-h-16 w-full items-center gap-3 py-3 text-left"
                  >
                    <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: b.color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.label}</span>
                      <span className="block truncate text-xs text-muted sm:text-sm">{b.sub}</span>
                    </span>
                    <span className="num text-base sm:text-lg">{kr(b.total)}</span>
                    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-muted transition-transform lg:-rotate-90 ${on ? "rotate-180 lg:-rotate-90" : ""}`} style={on ? { color: "var(--ink)" } : undefined}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {/* På mobil folder bunken sig ud lige under rækken */}
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div key="d" className="overflow-hidden lg:hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                        <div className="pb-5 pl-[18px] pt-1">
                          <Detail b={b} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        </div>

        {/* På computer står den valgte bunke ved siden af */}
        <div className="card hidden min-w-0 p-8 lg:block" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {active ? (
              <motion.div key={active.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.22 }}>
                <p className="eyebrow">{active.sub}</p>
                <h3 className="mt-1 text-2xl font-bold">{active.label}</h3>
                <p className="fig num mt-1 text-4xl" style={{ color: active.color === "var(--accent)" ? "var(--accent-text)" : active.color }}>
                  {kr(active.total)}
                </p>
                <div className="mt-6">
                  <Detail b={active} />
                </div>
              </motion.div>
            ) : (
              <motion.p key="none" className="text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Vælg en bunke for at se, hvad der ligger i den.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Chapter>
  );
}
