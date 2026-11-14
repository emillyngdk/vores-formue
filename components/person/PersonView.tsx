"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { signedKr } from "@/lib/format";
import { ScenarioChart } from "@/components/lab/ScenarioChart";
import { Ticker } from "@/components/ui/Ticker";
import { YEARS, YearPicker } from "@/components/ui/YearPicker";
import { people } from "@/data/household";
import type { YearRow } from "@/lib/engine";
import { useScenario } from "@/lib/scenario";

type Who = "emil" | "frederikke";
type Line = { label: string; value: number; note?: string };
type Block = { id: string; title: string; color: string; lines: Line[]; total: { label: string; value: number } };

const COLOR: Record<Who, string> = { emil: "var(--violet)", frederikke: "var(--sky)" };

/** Opgørelsen for én person i ét år. Alle tal kommer fra regnemotoren, og summen er præcis den samme som motorens. */
export function blocks(r: YearRow, who: Who): Block[] {
  const p = r[who];
  const home = r.ownsHouse ? "huset" : "lejligheden";
  const bolig: Line[] = [{ label: `Halvdelen af ${home}s værdi`, value: r.homeValue / 2 }, { label: "Halvdelen af realkreditlånet", value: -r.realkredit / 2 }];
  if (r.prioritetslaan > 0.5) bolig.push({ label: "Halvdelen af prioritetslånet", value: -r.prioritetslaan / 2 });
  if (r.energilaan > 0.5) bolig.push({ label: "Halvdelen af energilånet", value: -r.energilaan / 2 });
  if (r.salaer > 0.5) bolig.push({ label: "Halvdelen af salæret ved salget", value: -r.salaer / 2, note: "Trækkes fra nu, så friværdien er det, I reelt får ud" });

  const depot = p.stocksValue - p.askValue;
  const aktier: Line[] = [
    { label: "Frit depot, markedsværdi", value: depot, note: `Heraf indbetalt ${Math.round(p.stocksBasis).toLocaleString("da-DK")} kr.` },
    { label: "Skat, hvis alt blev solgt", value: -p.stocksTax },
  ];
  if (p.askValue > 0.5) aktier.push({ label: "Aktiesparekonto", value: p.askValue, note: "Skatten betales løbende" });

  const konti: Line[] = [{ label: "Egen konto", value: p.cash }];
  if (p.kontoShare > 0.5) konti.push({ label: "Halvdelen af PrioritetsKontoen", value: p.kontoShare });
  if (p.suLoan > 0.5) konti.push({ label: "SU-lån", value: -p.suLoan });

  return [
    { id: "bolig", title: "Boligen", color: "var(--mint)", lines: bolig, total: { label: "Din del af friværdien", value: p.equityShare } },
    { id: "aktier", title: "Aktier", color: "var(--violet)", lines: aktier, total: { label: "Aktier efter skat", value: p.stocksNet } },
    { id: "konti", title: "Konti og gæld", color: "var(--accent)", lines: konti, total: { label: "I alt", value: p.cash + p.kontoShare - p.suLoan } },
  ];
}

function Amount({ v, strong }: { v: number; strong?: boolean }) {
  return <Ticker value={v} className={strong ? "" : "!font-semibold"} />;
}

export function PersonView({ who }: { who: Who }) {
  const { sim, changed } = useScenario();
  const [year, setYear] = useState(2026);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const i = year - 2026;
  const r = sim.rows[i];
  const p = r[who];
  const info = people[who];
  const other: Who = who === "emil" ? "frederikke" : "emil";
  const list = blocks(r, who);
  const start = sim.rows[0][who];
  const allOpen = open.size === list.length;
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const since = (v: number) =>
    i > 0 && (
      <p className="num mt-1.5 text-xs" style={{ color: v >= 0 ? "var(--mint)" : "var(--coral)" }}>
        {signedKr(v)} siden 2026
      </p>
    );

  // Sammensætningen som én bjælke. Negative poster (fx SU-lån) står i opgørelsen.
  const parts = [
    { label: "Bolig", value: p.equityShare, color: "var(--mint)" },
    { label: "Aktier", value: p.stocksNet, color: "var(--violet)" },
    { label: "Konti", value: p.cash + p.kontoShare, color: "var(--accent)" },
    { label: "Pension", value: p.pension, color: "var(--sky)" },
  ];
  const positive = parts.reduce((a, x) => a + Math.max(x.value, 0), 0) || 1;

  const series = [
    { id: "med", color: "var(--accent)", values: sim.rows.map((x) => x[who].wealthWithPension), strong: true },
    { id: "uden", color: COLOR[who], values: sim.rows.map((x) => x[who].wealth), dashed: true },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-5 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="-ml-2 flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-muted hover:text-ink">
          <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Overblik
        </Link>
        <nav aria-label="Vælg person" className="flex rounded-full border border-line bg-surface p-1">
          {(["emil", "frederikke"] as Who[]).map((w) => {
            const on = w === who;
            return (
              <Link
                key={w}
                href={`/${w}`}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {on && <motion.span layoutId="person-pill" className="absolute inset-0 rounded-full bg-surface-2" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative h-2 w-2 rounded-full" style={{ background: COLOR[w] }} aria-hidden />
                <span className="relative">{people[w].name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <header className="mt-6 sm:mt-10">
        <p className="eyebrow">
          {info.name}s formue · {info.ageOct2026 + i} år i oktober {year}
        </p>
        <h1 className="display mt-3 text-[clamp(2.2rem,9vw,5rem)]" style={{ color: COLOR[who] }}>
          {info.name}
        </h1>
        <div className="mt-5 grid grid-cols-2 border-y border-line">
          <div className="min-w-0 py-4 pr-4">
            <p className="eyebrow">Med pension</p>
            <p className="mt-1.5 text-[clamp(1.3rem,5.4vw,2.6rem)] leading-none">
              <Ticker value={p.wealthWithPension} countUp />
            </p>
            {since(p.wealthWithPension - start.wealthWithPension)}
          </div>
          <div className="min-w-0 border-l border-line py-4 pl-4 sm:pl-6">
            <p className="eyebrow">Uden pension</p>
            <p className="mt-1.5 text-[clamp(1.3rem,5.4vw,2.6rem)] leading-none">
              <Ticker value={p.wealth} countUp />
            </p>
            {since(p.wealth - start.wealth)}
          </div>
        </div>
        {changed && <p className="mt-3 text-sm text-muted">Viser det, I har ændret under Hvad nu hvis.</p>}
      </header>

      {/* På telefon bliver årsvælgeren hængende øverst, så man kan skifte år mens man læser opgørelsen */}
      <div className="sticky-mobile mt-6">
        <YearPicker year={year} setYear={setYear} id="person-year" />
      </div>

      {/* Sammensætningen */}
      <div className="mt-4" aria-hidden>
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
          {parts.map((x) => (
            <div key={x.label} style={{ width: `${(Math.max(x.value, 0) / positive) * 100}%`, background: x.color, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
          ))}
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
        {parts.map((x) => (
          <li key={x.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} aria-hidden />
              {x.label}
            </span>
            <Ticker value={x.value} kind="mioShort" />
          </li>
        ))}
      </ul>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Opgørelsen */}
        <section aria-labelledby="opgoerelse" className="card min-w-0 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <h2 id="opgoerelse" className="text-lg font-bold leading-snug">
              Sådan er den opgjort
              <span className="block text-sm font-normal text-muted">Oktober {year}</span>
            </h2>
            <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(list.map((b) => b.id)))} className="-mr-2 min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold lg:hidden" style={{ color: "var(--accent-text)" }}>
              {allOpen ? "Skjul" : "Vis alle"}<span className="hidden min-[380px]:inline"> poster</span>
            </button>
          </div>
          <div className="mt-3 divide-y divide-line">
            {list.map((b) => {
              const on = open.has(b.id);
              return (
                <div key={b.id}>
                  <button type="button" onClick={() => toggle(b.id)} aria-expanded={on} className="flex min-h-14 w-full items-center gap-3 py-3 text-left lg:pointer-events-none">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.title}</span>
                      <span className="block text-xs text-muted">{b.total.label}</span>
                    </span>
                    <span style={b.total.value < -0.5 ? { color: "var(--coral)" } : undefined}>
                      <Amount v={b.total.value} strong />
                    </span>
                    <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-muted transition-transform duration-300 lg:hidden ${on ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {/* Folder ud med en blød højdeanimation. På store skærme står posterne altid fremme. */}
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out lg:grid-rows-[1fr] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="min-h-0 overflow-hidden">
                      <dl className="space-y-2.5 pb-4 pl-[22px] text-sm">
                        {b.lines.map((l) => (
                          <div key={l.label}>
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-muted">{l.label}</dt>
                              <dd className="shrink-0" style={l.value < -0.5 ? { color: "var(--coral)" } : undefined}>
                                <Amount v={l.value} />
                              </dd>
                            </div>
                            {l.note && <p className="mt-0.5 text-xs text-muted opacity-80">{l.note}</p>}
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <dl className="mt-4 space-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-semibold">Formue uden pension</dt>
              <dd>
                <Amount v={p.wealth} strong />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">Pension, før skat</dt>
              <dd>
                <Amount v={p.pension} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
              <dt className="text-base font-bold">Formue med pension</dt>
              <dd className="text-lg" style={{ color: "var(--accent-text)" }}>
                <Amount v={p.wealthWithPension} strong />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Boligen, lånene og PrioritetsKontoen deler I 50/50. Aktier, egen konto, pension og SU-lån er jeres egne. Pensionen er låst til pensionsalderen og vist før skat.
          </p>
        </section>

        {/* Udviklingen */}
        <section aria-labelledby="udvikling" className="card min-w-0 self-start p-3 sm:p-5">
          <div className="px-2 pt-2">
            <h2 id="udvikling" className="text-lg font-bold">
              Udviklingen frem til 2035
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: "var(--accent)" }} aria-hidden />
                Med pension
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: COLOR[who] }} aria-hidden />
                Uden pension
              </li>
              <li>Tryk i grafen for at vælge år</li>
            </ul>
          </div>
          <div className="mt-2">
            <ScenarioChart series={series} years={YEARS} index={i} onIndex={(n) => setYear(2026 + n)} height={240} />
          </div>
          <Link href={`/${other}`} className="mt-2 flex min-h-12 items-center justify-between rounded-2xl px-3 text-sm font-semibold hover:bg-surface-2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[other] }} aria-hidden />
              Se {people[other].name}s opgørelse
            </span>
            <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
