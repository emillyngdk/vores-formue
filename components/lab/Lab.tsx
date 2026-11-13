"use client";

import { useEffect, useState } from "react";
import { Delta } from "@/components/ui/Delta";
import { Range } from "@/components/ui/Range";
import { Segmented } from "@/components/ui/Segmented";
import { Ticker } from "@/components/ui/Ticker";
import { loans, taxRules2026 } from "@/data/household";
import { EventFields } from "@/components/whatif/EventFields";
import { BASE, PRESETS, type ScenarioParams, type YearRow } from "@/lib/engine";
import { kr, pct } from "@/lib/format";
import { useLocalStorage } from "@/lib/hooks";
import { readScenarioQuery, writeScenarioQuery } from "@/lib/route-state";
import { useScenario } from "@/lib/scenario";
import { decodeScenario, encodeScenario } from "@/lib/scenario-url";
import { LineCompare } from "./LineCompare";

const PRESET_LIST: { id: string; label: string; params: ScenarioParams }[] = [
  { id: "forsigtig", label: "Forsigtig", params: PRESETS.forsigtig },
  { id: "basis", label: "Basis", params: PRESETS.basis },
  { id: "god", label: "God", params: PRESETS.god },
  { id: "nykredit", label: "Nykredit-optimistisk", params: { ...BASE, apartmentSalePrice: 7_350_000, housePrice: 7_100_000 } },
];

type Saved = { name: string; q: string };
const mioShort = (n: number) => `${(n / 1e6).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mio. kr.`;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5 sm:p-6">
      <legend className="eyebrow float-left mb-4 w-full">{title}</legend>
      <div className="clear-both space-y-5">{children}</div>
    </fieldset>
  );
}

export function Lab() {
  const sc = useScenario();
  const { draft: p, setDraft: setP, sim: result, planSim } = sc;
  const [withPension, setWithPension] = useState(true);
  const [saved, setSaved, loaded, shared] = useLocalStorage<Saved[]>("vf-scenarios", []);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  // Et scenarie kan ligge i adressen, fx når det åbnes fra Spørg Claude
  useEffect(() => {
    const q = readScenarioQuery();
    if (q) setP(decodeScenario(q));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!ready) return;
    writeScenarioQuery(encodeScenario(p));
  }, [p, ready]);

  const set = sc.set;
  const pick = (r: YearRow) => (withPension ? r.wealthWithPension : r.wealth);
  const scenario = result.rows.map(pick);
  const baseline = planSim.rows.map(pick);
  const years = result.rows.map((r) => r.year);
  const events = p.events ?? [];
  // Færdige scenarier ændrer forudsætningerne, men beholder de køb, der er lagt ind
  const withEvents = (x: ScenarioParams): ScenarioParams => (events.length ? { ...x, events } : x);
  const q = encodeScenario(p);
  const end = result.rows[9];
  const sale = result.sale;
  const saleYear = 2026 + p.saleMonth / 12;

  const save = () => {
    const n = name.trim();
    if (!n) return;
    setSaved([{ name: n, q }, ...saved.filter((s) => s.name !== n)].slice(0, 12));
    setName("");
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Scenarie-lab</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,5rem)]">Hvad nu hvis</h1>
      <p className="mt-3 max-w-2xl text-muted sm:text-lg">Skru på forudsætningerne og se, hvad det gør ved formuen. Den stiplede linje er vores plan. Det, I ændrer her, følger med over på forsiden.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Færdige scenarier">
        {PRESET_LIST.map((x) => {
          const active = encodeScenario(withEvents(x.params)) === q;
          return (
            <button
              key={x.id}
              type="button"
              aria-pressed={active}
              onClick={() => setP(withEvents(x.params))}
              className="min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors"
              style={active ? { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" } : { borderColor: "var(--line)", background: "var(--surface)" }}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Resultat */}
        <div className="sticky top-0 z-30 -mx-4 min-w-0 border-b border-line bg-bg px-4 py-3 lg:bg-surface md:top-[calc(var(--top-nav)+12px)] lg:mx-0 lg:rounded-3xl lg:border lg:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <p className="eyebrow">2035 · {withPension ? "med" : "uden"} pension</p>
              <p className="mt-0.5 text-[clamp(1.6rem,6.2vw,3.25rem)] leading-none" style={{ color: "var(--accent-text)" }}>
                <Ticker value={scenario[9]} />
              </p>
            </div>
            <Segmented size="sm" options={[{ value: "med", label: "Med pension" }, { value: "uden", label: "Uden" }]} value={withPension ? "med" : "uden"} onChange={(v) => setWithPension(v === "med")} label="Pension" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2"><span className="text-muted">2035</span> <Delta v={scenario[9] - baseline[9]} /></span>
            <span className="hidden items-center gap-2 sm:flex"><span className="text-muted">2031 {mioShort(scenario[5])}</span> <Delta v={scenario[5] - baseline[5]} /></span>
          </div>
          <div className="mt-2 hidden lg:block"><LineCompare scenario={scenario} baseline={baseline} years={years} height={320} /></div>
          <div className="mt-2 lg:hidden"><LineCompare scenario={scenario} baseline={baseline} years={years} height={112} /></div>
          <dl className="mt-3 hidden grid-cols-2 gap-3 text-sm lg:grid">
            <div className="rounded-2xl bg-surface-2 p-4">
              <dt className="text-muted">Emil i 2035, uden pension</dt>
              <dd className="mt-1 text-lg"><Ticker value={end.emil.wealth} /></dd>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <dt className="text-muted">Frederikke i 2035, uden pension</dt>
              <dd className="mt-1 text-lg"><Ticker value={end.frederikke.wealth} /></dd>
            </div>
          </dl>
        </div>

        {/* Skydere */}
        <div className="min-w-0 space-y-4">
          <Group title="Afkast">
            <Range label="Aktieafkast om året" value={p.stockReturn} min={0.02} max={0.12} step={0.005} onChange={(v) => set("stockReturn", v)} display={pct(p.stockReturn, 1)} color="var(--violet)" />
            <Range label="Pensionsafkast om året" value={p.pensionReturn} min={0.01} max={0.07} step={0.005} onChange={(v) => set("pensionReturn", v)} display={pct(p.pensionReturn, 1)} color="var(--sky)" />
            <Range label="Huspriser om året, efter købet" value={p.houseGrowth} min={0} max={0.07} step={0.005} onChange={(v) => set("houseGrowth", v)} display={pct(p.houseGrowth, 1)} color="var(--mint)" />
          </Group>

          <Group title="Bolighandlen">
            <Range label="Lejlighedens værdi og salgspris" value={p.apartmentSalePrice} min={6_000_000} max={8_000_000} step={50_000} onChange={(v) => set("apartmentSalePrice", v)} display={mioShort(p.apartmentSalePrice)} color="var(--mint)" />
            <Range label="Husets pris" value={p.housePrice} min={5_500_000} max={8_000_000} step={50_000} onChange={sc.setHousePrice} display={mioShort(p.housePrice)} color="var(--mint)" hint="Udbetalingen er 20 %, resten er realkredit uden afdrag. Et dyrere hus koster mere i rente, og det trækkes fra Nordnet efter flytningen." />
            <div>
              <p className="mb-2 text-sm font-semibold">Hvornår sælger vi? <span className="font-normal text-muted">I oktober</span></p>
              <Segmented options={[2027, 2028, 2029, 2030].map((y) => ({ value: y, label: String(y) }))} value={saleYear} onChange={(y) => set("saleMonth", (y - 2026) * 12)} label="Salgsår" size="sm" />
            </div>
            {sale && (
              <p className="rounded-2xl bg-surface-2 p-4 text-sm" style={sale.surplus < 100_000 ? { color: "var(--coral)" } : undefined}>
                {sale.surplus < 0
                  ? `Der mangler ${kr(-sale.surplus)} til udbetaling og omkostninger. I modellen tages de fra aktierne.`
                  : `Overskud efter handlen: ${kr(sale.surplus)}, altså ${kr(sale.perPerson)} til hver.`}
              </p>
            )}
          </Group>

          <Group title="Opsparing">
            <Range label="Emil til Nordnet pr. måned" value={p.nordnetEmil} min={0} max={15_000} step={500} onChange={(v) => set("nordnetEmil", v)} display={kr(p.nordnetEmil)} color="var(--violet)" />
            <Range label="Frederikke til Nordnet pr. måned" value={p.nordnetFrederikke} min={0} max={15_000} step={500} onChange={(v) => set("nordnetFrederikke", v)} display={kr(p.nordnetFrederikke)} color="var(--sky)" hint={`Efter flytningen trækkes ${kr(p.nordnetCutAfterMove)} fra hos hver, fordi huset koster mere.`} />
            <Range label="Lønstigning om året" value={p.salaryGrowth} min={0} max={0.05} step={0.005} onChange={(v) => set("salaryGrowth", v)} display={pct(p.salaryGrowth, 1)} hint="Hæver pension og Nordnet-opsparing i samme takt." />
            <Range label="Andel af opsparingen på aktiesparekonto" value={p.askShare} min={0} max={1} step={0.1} onChange={(v) => set("askShare", v)} display={pct(p.askShare, 0)} color="var(--mint)" hint={`Forenklet: 17 % skat af årets afkast, og indskud til loftet på ${kr(taxRules2026.aktiesparekonto.depositCap2027)} er nået.`} />
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-semibold">
                SU-pengene til Nordnet fra 2032
                <span className="block text-xs font-normal text-muted">{kr(loans.suLoan.monthly)} om måneden, når SU-lånet er betalt.</span>
              </span>
              <input type="checkbox" role="switch" checked={p.suToNordnet} onChange={(e) => set("suToNordnet", e.target.checked)} className="h-6 w-6 shrink-0" style={{ accentColor: "var(--accent)" }} />
            </label>
          </Group>

          <Group title="Engangskøb">
            {events.length === 0 && <p className="text-sm text-muted">Læg fx en bil ind, og se hvad den koster i formue. Købet regnes som en ren udgift.</p>}
            {events.map((e) => (
              <details key={e.id} className="group rounded-2xl bg-surface-2" open={events.length === 1}>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold">
                  <span style={e.on ? undefined : { textDecoration: "line-through", opacity: 0.6 }}>{e.label || "Køb"} · januar {e.year}</span>
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
          </Group>

          <div className="card p-5 sm:p-6">
            <h2 className="eyebrow">Gem scenariet</h2>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <label className="sr-only" htmlFor="scenario-name">Navn på scenariet</label>
              <input id="scenario-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Giv det et navn" maxLength={40} className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 text-sm" />
              <button type="submit" className="cta min-h-11 px-5 text-sm" disabled={!name.trim()}>Gem</button>
            </form>
            {loaded && saved.length > 0 && (
              <ul className="mt-4 space-y-2">
                {saved.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <button type="button" onClick={() => setP(decodeScenario(s.q))} className="min-h-11 min-w-0 flex-1 truncate rounded-2xl bg-surface-2 px-4 text-left text-sm font-semibold">{s.name}</button>
                    <button type="button" onClick={() => setSaved(saved.filter((x) => x.name !== s.name))} aria-label={`Slet ${s.name}`} className="min-h-11 rounded-2xl border border-line px-3 text-sm text-muted">Slet</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">{shared ? "Gemte scenarier ligger på siden, så I begge kan se dem." : "Gemmes kun på denne enhed. Adressen i browseren indeholder også scenariet, så den kan sendes til den anden."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={sc.reset} disabled={!sc.changed} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold disabled:opacity-40">Nulstil til planen</button>
              <button type="button" onClick={sc.savePlan} disabled={!sc.changed} className="cta min-h-11 px-5 text-sm disabled:opacity-40">Gem som vores plan</button>
              {!sc.planIsOriginal && !sc.changed && (
                <button type="button" onClick={sc.restoreOriginal} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold">Tilbage til den oprindelige plan</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
