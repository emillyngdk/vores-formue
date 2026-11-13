"use client";

import { useId } from "react";
import { Range } from "@/components/ui/Range";
import { Segmented } from "@/components/ui/Segmented";
import { EVENT_YEARS, type EventOutcome, type PlanEvent, eventMonth, loanPayment } from "@/lib/engine";
import { kr, pct } from "@/lib/format";
import { useScenario } from "@/lib/scenario";

const PAY = [
  { value: "konto", label: "PrioritetsKonto" },
  { value: "aktier", label: "Aktier" },
  { value: "laan", label: "Lån" },
] as const;

function outcomeText(e: PlanEvent, o: EventOutcome | undefined) {
  if (!e.on) return "Købet er slået fra og tæller ikke med.";
  if (e.pay === "laan") return `Ydelsen bliver ca. ${kr(loanPayment(e.amount, e.loanRate, e.loanYears))} om måneden i ${e.loanYears} år. Den går fra det, vi sætter i Nordnet.`;
  if (!o) return "";
  const tax = o.tax > 500 ? ` Salget udløser ca. ${kr(o.tax)} i skat.` : "";
  if (o.fromKonto > 0 && o.fromStocks > 0) return `${kr(o.fromKonto)} tages fra PrioritetsKontoen og ${kr(o.fromStocks)} fra aktierne.${tax}`;
  if (o.fromKonto > 0) return `Hele beløbet tages fra PrioritetsKontoen.`;
  return `${kr(o.fromStocks)} tages fra aktierne, ligeligt fra os begge.${tax}`;
}

/** Felterne til ét engangskøb. Bruges både i skuffen på forsiden og i lab'et. */
export function EventFields({ event: e }: { event: PlanEvent }) {
  const { updateEvent, removeEvent, sim, draft } = useScenario();
  const id = useId();
  const o = sim.events.find((x) => x.id === e.id);
  const set = (patch: Partial<PlanEvent>) => updateEvent(e.id, patch);
  const afterMove = eventMonth(e.year) > draft.saleMonth;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${id}-label`} className="text-sm font-semibold">
          Hvad køber vi?
        </label>
        <input
          id={`${id}-label`}
          value={e.label}
          maxLength={24}
          onChange={(ev) => set({ label: ev.target.value.replace(/[~|]/g, "") })}
          className="mt-2 min-h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm"
        />
      </div>
      <Range label="Pris" value={e.amount} min={10_000} max={1_000_000} step={10_000} onChange={(v) => set({ amount: v })} display={kr(e.amount)} />
      <Range label="Hvornår" value={e.year} min={EVENT_YEARS[0]} max={EVENT_YEARS[1]} step={1} onChange={(v) => set({ year: v })} display={`januar ${e.year}`} />
      <div>
        <p className="mb-2 text-sm font-semibold">Betales med</p>
        <Segmented options={PAY} value={e.pay} onChange={(v) => set({ pay: v })} label="Betales med" size="sm" />
        {e.pay === "konto" && afterMove && <p className="mt-2 text-xs text-muted">Efter flytningen er der ingen PrioritetsKonto, så pengene tages fra aktierne.</p>}
      </div>
      {e.pay === "laan" && (
        <>
          <Range label="Løbetid" value={e.loanYears} min={1} max={10} step={1} onChange={(v) => set({ loanYears: v })} display={`${e.loanYears} år`} />
          <Range label="Rente" value={e.loanRate} min={0} max={0.1} step={0.0025} onChange={(v) => set({ loanRate: v })} display={pct(e.loanRate, 2)} hint="Renten er et gæt. Sæt den, I får tilbudt." />
        </>
      )}
      <p className="rounded-2xl bg-surface-2 p-4 text-sm" role="status">
        {outcomeText(e, o)}
        {o && o.shortfall > 500 && (
          <span className="mt-1 block" style={{ color: "var(--coral)" }}>
            Der mangler {kr(o.shortfall)}. Der er ikke nok at tage af i {e.year}.
          </span>
        )}
      </p>
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input type="checkbox" role="switch" checked={e.on} onChange={(ev) => set({ on: ev.target.checked })} className="h-5 w-5" style={{ accentColor: "var(--accent)" }} />
          Tæl med
        </label>
        <button type="button" onClick={() => removeEvent(e.id)} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold" style={{ color: "var(--coral)" }}>
          Fjern
        </button>
      </div>
      <p className="text-xs text-muted">Regnes som en ren udgift. Det købte tæller ikke med i formuen, ligesom bilen ikke gør det i dag.</p>
    </div>
  );
}
