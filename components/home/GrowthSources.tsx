"use client";

import { Chapter } from "@/components/ui/Chapter";
import { type Step, Waterfall } from "@/components/ui/Waterfall";
import { mio } from "@/lib/format";
import { useScenarioCalm } from "@/lib/scenario";

export function GrowthSources() {
  const { growth: g, sim } = useScenarioCalm();
  const p = g.parts;
  const steps: Step[] = [
    { label: "Formue i dag", value: g.start, kind: "total", color: "var(--muted)" },
    { label: "Indbetalt på Nordnet", value: p.stocksIn, kind: "delta", color: "var(--copper)" },
    { label: "Afkast på aktier", value: p.stocksReturn, kind: "delta", color: "var(--copper)" },
    { label: sim.events.some((e) => e.tax > 0.5) ? "Skat på aktierne" : "Skat, hvis aktierne sælges", value: p.taxIfSold, kind: "delta" },
    { label: "Indbetalt til pension", value: p.pensionIn, kind: "delta", color: "var(--steel)" },
    { label: "Afkast på pension", value: p.pensionReturn, kind: "delta", color: "var(--steel)" },
    { label: "Husets værdistigning", value: p.houseGrowth, kind: "delta", color: "var(--mint)" },
    { label: "Afdrag på SU og energilån", value: p.debtPaid + p.prioritetsKontoIn, kind: "delta", color: "var(--accent-text)" },
    { label: "Bolighandel og flytning", value: p.housingTransaction, kind: "delta" },
    ...(Math.abs(p.events) > 0.5 ? [{ label: "Engangskøb", value: p.events, kind: "delta" as const }] : []),
    { label: "Formue i 2035", value: g.end, kind: "total" },
  ];

  const own = p.stocksIn + p.pensionIn + p.debtPaid + p.prioritetsKontoIn;
  const earned = p.stocksReturn + p.pensionReturn + p.houseGrowth;
  const cost = p.taxIfSold + p.housingTransaction + p.events;
  const ownShare = g.total > 0 ? Math.round((own / g.total) * 100) : 0;
  const loans = sim.events.filter((e) => e.pay === "laan");

  const cards = [
    { k: "Det vi selv sætter ind", v: own, c: "var(--copper)", t: "Nordnet, pension og afdrag." },
    { k: "Det pengene tjener", v: earned, c: "var(--mint)", t: "Afkast på aktier og pension, og husets værdistigning." },
    {
      k: "Det koster", v: cost, c: "var(--coral)",
      t: Math.abs(p.events) > 0.5 ? "Skat på aktiegevinsten, bolighandlen og engangskøb." : "Skat på aktiegevinsten, hvis alt blev solgt i 2035, og omkostninger ved bolighandlen.",
    },
  ];

  return (
    <Chapter
      id="vaekst"
      no="04"
      kicker="2026 til 2035"
      title="Hvor kommer væksten fra"
      intro={`Formuen vokser med ${mio(g.total)} med pension. Vi sætter selv ${ownShare} % ind, og resten tjener pengene.`}
    >
      <div className="card p-5 sm:p-8">
        <Waterfall steps={steps} label="Væksten fra 2026 til 2035, post for post" />
        {loans.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Ydelsen på lån til engangskøb går fra Nordnet-opsparingen. Derfor er der indbetalt mindre på Nordnet end i planen.
          </p>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.k} className="card h-full p-6">
            <p className="eyebrow" style={{ color: c.c }}>{c.k}</p>
            <p className="num mt-2 text-3xl">
              {c.v < 0 ? "−" : "+"}
              {mio(Math.abs(c.v))}
            </p>
            <p className="mt-2 text-sm text-muted">{c.t}</p>
          </div>
        ))}
      </div>
    </Chapter>
  );
}
