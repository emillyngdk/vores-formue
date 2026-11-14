"use client";

import { useState } from "react";
import { Range } from "@/components/ui/Range";
import { Ticker } from "@/components/ui/Ticker";
import { loans, snapshot } from "@/data/household";
import { prioritetslaanCost } from "@/lib/engine";
import { kr, pct, signedKr } from "@/lib/format";

const L = loans.prioritetslaan;
const TODAY = snapshot.shared.prioritetsKonto;
const todayCost = prioritetslaanCost(TODAY);

export function Prioritetslaan() {
  const [konto, setKonto] = useState<number>(TODAY);
  const cost = prioritetslaanCost(konto);
  const diff = cost.monthly - todayCost.monthly;
  const atToday = Math.abs(konto - TODAY) < 500;
  const low = konto < L.minKontoAtQuarterEnd;

  return (
    <div>
      <p className="max-w-2xl text-muted sm:text-lg">Pengene på PrioritetsKontoen trækker renten på lånet ned. Jo mere der står, jo billigere er lånet.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Effektiv rente</p>
              <p className="fig mt-1 text-[clamp(2.6rem,9vw,4.5rem)] leading-none" style={{ color: "var(--accent-text)" }}>
                <Ticker value={cost.effectiveRate} kind="pct" />
              </p>
              <p className="mt-2 text-sm text-muted">efter kontorente og boligrabat</p>
            </div>
            <div>
              <p className="eyebrow">Nettorente pr. måned</p>
              <p className="fig mt-1 text-[clamp(1.8rem,6vw,2.75rem)] leading-none">
                <Ticker value={cost.monthly} />
              </p>
              <p className="mt-2 text-sm" style={{ color: atToday ? "var(--muted)" : diff > 0 ? "var(--coral)" : "var(--mint)" }}>
                {atToday ? "Sådan står det i dag, før skat" : `${signedKr(diff)} om måneden i forhold til i dag`}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative h-12 overflow-hidden rounded-2xl bg-surface-2" aria-hidden>
              <div
                className="absolute inset-y-0 left-0 rounded-2xl"
                style={{ width: `${(konto / L.principal) * 100}%`, background: "var(--mint)", transition: "width .15s ease-out" }}
              />
              <div className="absolute inset-y-0 w-0.5" style={{ left: `${(TODAY / L.principal) * 100}%`, background: "var(--ink)" }} />
              <div className="absolute inset-y-0 w-0.5 opacity-60" style={{ left: `${(L.minKontoAtQuarterEnd / L.principal) * 100}%`, background: "var(--coral)" }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted" aria-hidden>
              <span>0 kr.</span>
              <span>Lånet: {kr(L.principal)}</span>
            </div>
            <div className="mt-4">
              <Range
                label="Saldo på PrioritetsKontoen"
                value={konto}
                min={0}
                max={L.principal}
                step={1000}
                onChange={(v) => setKonto(Math.abs(v - TODAY) < 2500 ? TODAY : v)}
                display={kr(konto)}
                color="var(--mint)"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="chip" onClick={() => setKonto(TODAY)}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--ink)" }} />I dag: {kr(TODAY)}
              </button>
              <span className="chip" style={low ? { borderColor: "var(--coral)", color: "var(--coral)" } : undefined}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--coral)" }} />
                Mindst {kr(L.minKontoAtQuarterEnd)} ved kvartalsskift
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-6">
            <p className="eyebrow">Tommelfingerregel</p>
            <p className="mt-2 text-xl font-semibold leading-snug">
              Hver 10.000 kr. vi tager fra kontoen, koster ca. <span style={{ color: "var(--accent-text)" }}>{L.costPer10kWithdrawn} kr.</span> om måneden.
            </p>
          </div>
          <div className="card p-6">
            <dl className="space-y-2 text-sm">
              {[
                ["Lånerente", pct(L.rate)],
                ["Rente på kontoen", pct(L.kontoRate)],
                ["Boligrabat af restgælden", pct(L.boligrabat)],
                ["Afdragsfrit til", String(L.interestOnlyUntil)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="num">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Prisen og gevinsten</p>
            <p className="mt-2 text-sm text-muted">
              Lånet koster ca. <span className="num text-ink">{L.extraCostVsOldAfterTax} kr.</span> mere om måneden efter skat end det gamle boliglån. Til gengæld
              betaler vi ikke afdrag, og det frigør ca. <span className="num text-ink">{kr(L.freedMonthly)}</span> om måneden til Nordnet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
