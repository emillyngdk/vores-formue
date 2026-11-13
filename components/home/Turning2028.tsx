"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Chapter } from "@/components/ui/Chapter";
import { Ticker } from "@/components/ui/Ticker";
import { type Step, Waterfall } from "@/components/ui/Waterfall";
import { plan } from "@/data/household";
import { type SaleEvent, effectiveCut, housingCostMonthly } from "@/lib/engine";
import { kr, mioTal } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useScenarioCalm } from "@/lib/scenario";

function steps(s: SaleEvent, pct: number): Step[] {
  return [
    { label: "Salgspris", value: s.salePrice, kind: "total", color: "var(--mint)" },
    { label: "Salær til mægler", value: -s.salaer, kind: "delta" },
    { label: "Realkredit", value: -s.realkredit, kind: "delta" },
    { label: "Prioritetslån", value: -s.prioritetslaan, kind: "delta" },
    { label: "Energilån", value: -s.energilaan, kind: "delta" },
    { label: "PrioritetsKonto", value: s.prioritetsKonto, kind: "delta" },
    { label: "Nettoprovenu", value: s.net, kind: "total" },
    { label: `Udbetaling på huset (${pct} %)`, value: -s.downPayment, kind: "delta" },
    { label: "Købsomkostninger og flytning", value: -(s.purchaseCosts + s.movingCosts), kind: "delta" },
    { label: s.surplus < 0 ? "Mangler, tages fra aktierne" : "Overskud til investering", value: s.surplus, kind: "total", color: s.surplus < 0 ? "var(--coral)" : undefined },
  ];
}

const Apartment = () => (
  <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" aria-hidden>
    <rect x="14" y="8" width="36" height="50" rx="3" />
    <path d="M24 20h4M36 20h4M24 31h4M36 31h4M24 42h4M36 42h4M28 58V50h8v8" strokeLinecap="round" />
  </svg>
);
const House = () => (
  <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
    <path d="M8 30L32 10l24 20M14 26v30h36V26M27 56V40h10v16" />
  </svg>
);

export function Turning2028() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.9"] });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1.02]);
  const aptX = useTransform(scrollYProgress, [0.15, 0.55], [0, -40]);
  const aptO = useTransform(scrollYProgress, [0.15, 0.55], [1, 0.3]);
  const houseY = useTransform(scrollYProgress, [0.6, 1], [-40, 0]);
  const houseO = useTransform(scrollYProgress, [0.6, 0.95], [0.25, 1]);
  const { sim, draft } = useScenarioCalm();
  const s = sim.sale;
  if (!s) return null;
  const year = 2026 + draft.saleMonth / 12;
  const pct = Math.round(draft.downPaymentPct * 100);
  const cost = Math.round(housingCostMonthly(s.housePrice, draft.downPaymentPct, draft.newLoanRate) / 100) * 100;
  const cut = effectiveCut(draft);
  const extra = plan.extraHousingCostMonthly + cost - plan.newHousingCostMonthly;

  return (
    <Chapter
      id="vendepunktet"
      no="03"
      kicker={`Oktober ${year}`}
      title="Vendepunktet"
      intro={`Lejligheden sælges for ${mioTal(s.salePrice)} kr., og vi køber hus til ${mioTal(s.housePrice)} kr. med ${pct} % udbetaling og intet banklån.`}
    >
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5 sm:p-8">
          <div className="mb-4 flex items-center justify-between" aria-hidden>
            <motion.div style={reduced ? undefined : { x: aptX, opacity: aptO }} className="flex items-center gap-3 text-muted">
              <Apartment />
              <span className="text-sm font-semibold">Lejligheden</span>
            </motion.div>
            <span className="eyebrow hidden sm:inline">sælges og købes</span>
            <motion.div style={reduced ? undefined : { y: houseY, opacity: houseO }} className="flex items-center gap-3" >
              <span className="text-sm font-semibold" style={{ color: "var(--mint)" }}>Huset</span>
              <span style={{ color: "var(--mint)" }}><House /></span>
            </motion.div>
          </div>
          <div ref={ref}>
            <Waterfall steps={steps(s, pct)} progress={reduced ? undefined : progress} label="Fra salgspris til overskud" />
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div className="card p-6" style={{ borderColor: "color-mix(in srgb, var(--mint) 45%, transparent)" }}>
            <p className="eyebrow">Til hver af os</p>
            <p className="mt-2 text-[clamp(2rem,7vw,3rem)] leading-none" style={{ color: s.perPerson < 0 ? "var(--coral)" : "var(--mint)" }}>
              <Ticker value={s.perPerson} countUp />
            </p>
            <p className="mt-3 text-sm text-muted">
              {s.stocksPerPerson >= 0
                ? `${kr(s.cashPerPerson)} på egen konto og ${kr(s.stocksPerPerson)} i aktier.`
                : `${kr(s.cashPerPerson)} på egen konto. De ${kr(-s.stocksPerPerson)}, der mangler, tages fra aktierne.`}
            </p>
          </div>
          <div className="card p-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)" }}>
            <p className="eyebrow" style={{ color: "var(--accent-text)" }}>{extra < 0 ? "Huset koster mindre om måneden" : "Huset koster mere om måneden"}</p>
            <p className="num mt-2 text-3xl">{extra < 0 ? "−" : "+"}{kr(Math.abs(extra))}</p>
            <p className="mt-3 text-sm text-muted">
              Lånet på {kr(s.newRealkredit)} koster ca. {kr(cost)} om måneden i rente og bidrag.{" "}
              {cut >= 0 ? `Derfor skruer vi Nordnet ned med ${kr(cut)} hver efter flytningen.` : `Derfor kan vi hver sætte ${kr(-cut)} mere i Nordnet efter flytningen.`}
            </p>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
