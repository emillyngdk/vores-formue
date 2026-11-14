"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { Ticker } from "@/components/ui/Ticker";
import { YEARS, YearPicker } from "@/components/ui/YearPicker";
import { type ScenarioParams, type SimulationResult, simulate } from "@/lib/engine";
import { signedKr } from "@/lib/format";
import { useLocalStorage } from "@/lib/hooks";
import { useScenario } from "@/lib/scenario";
import { decodeScenario, encodeScenario } from "@/lib/scenario-url";
import { changedCount } from "@/lib/variables";
import { ScenarioChart, type Series } from "./ScenarioChart";

type Saved = { name: string; q: string };
type Kind = "plan" | "draft" | "preset" | "saved";
type Item = { id: string; name: string; note: string; color: string; params: ScenarioParams; sim: SimulationResult; kind: Kind };

/** Færdige scenarier. De bygger oven på jeres plan, så et gemt køb eller en anden huspris følger med. */
const PRESETS: { id: string; name: string; note: string; color: string; over: Partial<ScenarioParams> }[] = [
  { id: "forsigtig", name: "Forsigtig", note: "Lejligheden 6,75 mio., aktier 5 %, huse 1,5 %", color: "var(--coral)", over: { apartmentValue: 6_750_000, houseGrowth: 0.015, stockReturn: 0.05, pensionReturn: 0.03 } },
  { id: "god", name: "God", note: "Aktier 9 %, huse 4,5 %, pension 5 %", color: "var(--mint)", over: { houseGrowth: 0.045, stockReturn: 0.09, pensionReturn: 0.05 } },
  { id: "nykredit", name: "Nykredit-optimistisk", note: "Lejligheden stiger 2,5 % om året til salget, hus til 7,1 mio.", color: "var(--steel)", over: { apartmentGrowth: 0.025, housePrice: 7_100_000 } },
];
const SAVED_COLOR = "var(--copper)";

export function Compare({ year, setYear, withPension, setWithPension }: {
  year: number; setYear: (y: number) => void; withPension: boolean; setWithPension: (v: boolean) => void;
}) {
  const sc = useScenario();
  const [saved, setSaved, loaded, shared] = useLocalStorage<Saved[]>("vf-scenarios", []);
  const [name, setName] = useState("");
  const idx = year - 2026;
  const pick = (r: SimulationResult, i: number) => (withPension ? r.rows[i].wealthWithPension : r.rows[i].wealth);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [
      { id: "plan", name: "Planen", note: sc.planIsOriginal ? "Den oprindelige plan" : "Jeres gemte plan", color: "var(--muted)", params: sc.plan, sim: sc.planSim, kind: "plan" },
    ];
    const q = encodeScenario(sc.draft);
    const others = [...PRESETS.map((p) => encodeScenario({ ...sc.plan, ...p.over })), ...(loaded ? saved.map((s) => encodeScenario(decodeScenario(s.q))) : [])];
    // Er det, man har nu, et af de andre scenarier, vises det kun én gang
    if (sc.changed && !others.includes(q)) {
      const n = changedCount(sc.draft, sc.plan);
      list.push({ id: "draft", name: "Det, du ændrer nu", note: `${n} ${n === 1 ? "ændring" : "ændringer"} i forhold til planen`, color: "var(--accent)", params: sc.draft, sim: sc.sim, kind: "draft" });
    }
    for (const p of PRESETS) {
      const params = { ...sc.plan, ...p.over };
      list.push({ id: p.id, name: p.name, note: p.note, color: p.color, params, sim: simulate(params), kind: "preset" });
    }
    if (loaded) {
      for (const s of saved) {
        const params = decodeScenario(s.q);
        list.push({ id: `s-${s.name}`, name: s.name, note: "Gemt scenarie", color: SAVED_COLOR, params, sim: simulate(params), kind: "saved" });
      }
    }
    return list;
  }, [sc.plan, sc.planSim, sc.draft, sc.sim, sc.changed, sc.planIsOriginal, saved, loaded]);

  const draftQ = encodeScenario(sc.draft);
  const planVal = pick(sc.planSim, idx);
  const deltas = items.map((it) => pick(it.sim, idx) - planVal);
  const span = Math.max(...deltas.map(Math.abs), 1);

  const series: Series[] = items.map((it) => ({
    id: it.id,
    color: it.color,
    values: it.sim.rows.map((_, i) => pick(it.sim, i)),
    dashed: it.kind === "plan",
    strong: encodeScenario(it.params) === draftQ && it.kind !== "plan" ? true : it.kind === "draft",
  }));

  const use = (it: Item) => (it.kind === "plan" ? sc.reset() : sc.setDraft(it.params));
  const save = () => {
    const n = name.trim();
    if (!n) return;
    setSaved([{ name: n, q: draftQ }, ...saved.filter((s) => s.name !== n)].slice(0, 12));
    setName("");
  };

  return (
    <section id="sammenlign" aria-labelledby="sammenlign-title" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="sammenlign-title" className="display text-[clamp(1.6rem,5vw,2.75rem)]">
            Sammenlign scenarier
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">Vælg et år, og se alle scenarier side om side. Tryk på et scenarie for at bruge det.</p>
        </div>
        <Segmented size="sm" options={[{ value: "med", label: "Med pension" }, { value: "uden", label: "Uden pension" }]} value={withPension ? "med" : "uden"} onChange={(v) => setWithPension(v === "med")} label="Pension" />
      </div>

      <div className="mt-5">
        <YearPicker year={year} setYear={setYear} id="lab-year" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="card min-w-0 p-3 sm:p-5">
          <div className="lg:hidden">
            <ScenarioChart series={series} years={YEARS} index={idx} onIndex={(i) => setYear(2026 + i)} height={190} />
          </div>
          <div className="hidden lg:block">
            <ScenarioChart series={series} years={YEARS} index={idx} onIndex={(i) => setYear(2026 + i)} height={420} />
          </div>
        </div>

        <div className="card min-w-0 p-2 sm:p-3">
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((it, i) => {
                const v = pick(it.sim, idx);
                const d = deltas[i];
                const active = it.kind === "plan" ? !sc.changed : encodeScenario(it.params) === draftQ;
                const w = (Math.abs(d) / span) * 50;
                return (
                  <motion.li key={it.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="relative">
                    <button
                      type="button"
                      onClick={() => use(it)}
                      aria-pressed={active}
                      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-2"
                      style={active ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)" } : undefined}
                    >
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: it.color }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-semibold">
                            {it.name}
                            {active && <span className="ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>I brug</span>}
                          </span>
                          <Ticker value={v} className="text-sm sm:text-base" />
                        </span>
                        <span className="mt-0.5 flex items-baseline justify-between gap-3 text-xs">
                          <span className="truncate text-muted">{it.note}</span>
                          <span className="num shrink-0" style={{ color: it.kind === "plan" || Math.abs(d) < 500 ? "var(--muted)" : d > 0 ? "var(--mint)" : "var(--coral)" }}>
                            {it.kind === "plan" ? "udgangspunkt" : Math.abs(d) < 500 ? "som planen" : signedKr(d)}
                          </span>
                        </span>
                        {/* Forskel mod planen: til venstre er mindre, til højre er mere */}
                        {it.kind !== "plan" && (
                          <span className="relative mt-2 block h-1.5 rounded-full bg-surface-2" aria-hidden>
                            <span className="absolute inset-y-[-3px] left-1/2 w-px" style={{ background: "var(--muted)" }} />
                            <span
                              className="absolute inset-y-0 rounded-full"
                              style={{
                                background: d >= 0 ? "var(--mint)" : "var(--coral)",
                                width: `${w}%`,
                                left: d >= 0 ? "50%" : `${50 - w}%`,
                                transition: "width .45s cubic-bezier(.22,1,.36,1), left .45s cubic-bezier(.22,1,.36,1)",
                              }}
                            />
                          </span>
                        )}
                      </span>
                    </button>
                    {it.kind === "saved" && (
                      <button
                        type="button"
                        onClick={() => setSaved(saved.filter((s) => `s-${s.name}` !== it.id))}
                        aria-label={`Slet ${it.name}`}
                        className="absolute -right-1 -top-1 grid h-11 w-11 place-items-center rounded-full text-lg text-muted hover:text-ink"
                      >
                        ×
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <form
            className="mt-2 flex gap-2 border-t border-line px-1 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="sr-only" htmlFor="scenario-name">
              Navn på scenariet
            </label>
            <input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={sc.changed ? "Navn på det, du har nu" : "Ret noget først"}
              maxLength={40}
              disabled={!sc.changed}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 text-sm disabled:opacity-60"
            />
            <button type="submit" className="cta min-h-11 px-5 text-sm disabled:opacity-40" disabled={!sc.changed || !name.trim()}>
              Gem
            </button>
          </form>
          <p className="px-2 pb-1 pt-2 text-xs text-muted">{shared ? "Gemte scenarier ligger på siden, så I begge kan se dem." : "Gemte scenarier ligger på denne enhed."}</p>
        </div>
      </div>
    </section>
  );
}
