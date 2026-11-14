import { housingMarket } from "@/data/household";
import type { ScenarioParams } from "@/lib/engine";
import { kr, mioTal, pct } from "@/lib/format";

export type NumKey = Exclude<keyof ScenarioParams, "events" | "suToNordnet">;

export interface Field {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  step: number;
  nudge?: number;
  fmt: (v: number) => string;
  hint?: string;
  color?: string;
}

export interface Group {
  id: string;
  title: string;
  sub: string;
  fields: Field[];
  /** Særlige felter, der ikke er skydere */
  special?: ("saleYear" | "suToNordnet" | "events")[];
}

const p1 = (v: number) => pct(v, 1);
const p2 = (v: number) => pct(v, 2);
const p0 = (v: number) => pct(v, 0);
const md = (v: number) => `${kr(v)}/md.`;
const mio = (v: number) => `${mioTal(v)} kr.`;

const BLUE = "var(--blue)";
const CARAMEL = "var(--caramel)";
const MINT = "var(--mint)";
const CORAL = "var(--coral)";

/** Alle variabler i lab'et, i den rækkefølge de vises */
export const GROUPS: Group[] = [
  {
    id: "afkast",
    title: "Afkast og boligpriser",
    sub: "Hvad aktier, pension og boliger giver om året",
    fields: [
      { key: "stockReturn", label: "Aktier om året", min: -0.02, max: 0.12, step: 0.005, fmt: p1, color: BLUE },
      { key: "pensionReturn", label: "Pension om året", min: 0, max: 0.08, step: 0.005, fmt: p1, color: CARAMEL },
      {
        key: "apartmentGrowth", label: "Lejlighedens priser frem til salget", min: -0.05, max: 0.12, step: 0.005, fmt: p1, color: MINT,
        hint: `Om året. Nykredit venter ${pct(housingMarket.apartmentsAarhus.growth2027, 1)} for lejligheder i Aarhus i 2027.`,
      },
      { key: "houseGrowth", label: "Husets priser efter købet", min: -0.02, max: 0.08, step: 0.005, fmt: p1, color: MINT },
    ],
  },
  {
    id: "bolig",
    title: "Bolighandlen",
    sub: "Salget af lejligheden og købet af huset",
    fields: [
      { key: "apartmentValue", label: "Lejlighedens værdi i dag", min: 5_500_000, max: 9_000_000, step: 50_000, fmt: mio, color: MINT },
      { key: "housePrice", label: "Husets pris", min: 4_500_000, max: 9_000_000, step: 50_000, fmt: mio, color: MINT },
      { key: "downPaymentPct", label: "Udbetaling på huset", min: 0.05, max: 0.5, step: 0.01, fmt: p0, hint: "Resten er realkredit uden afdrag." },
      { key: "salaer", label: "Salær til mægler", min: 0, max: 150_000, step: 1_000, nudge: 5_000, fmt: kr, color: CORAL },
      { key: "purchaseCosts", label: "Købsomkostninger", min: 0, max: 150_000, step: 250, nudge: 5_000, fmt: kr, color: CORAL },
      { key: "movingCosts", label: "Flytning", min: 0, max: 150_000, step: 1_000, nudge: 5_000, fmt: kr, color: CORAL },
      { key: "cashAfterSale", label: "Kontant til hver efter salget", min: 0, max: 300_000, step: 5_000, fmt: kr, hint: "Resten af overskuddet går i aktier." },
    ],
    special: ["saleYear"],
  },
  {
    id: "laan",
    title: "Lån og renter",
    sub: "Rente og bidrag om året",
    fields: [
      {
        key: "newLoanRate", label: "Nyt realkreditlån på huset", min: 0.01, max: 0.07, step: 0.0001, nudge: 0.0025, fmt: p2,
        hint: "Rente og bidrag. Højere rente giver mindre til Nordnet efter flytningen.",
      },
      { key: "prioRate", label: "Prioritetslånet", min: 0.01, max: 0.08, step: 0.0001, nudge: 0.0025, fmt: p2, hint: "Variabel rente frem til salget." },
      { key: "kontoRate", label: "Rente på PrioritetsKontoen", min: 0, max: 0.07, step: 0.0001, nudge: 0.0025, fmt: p2, hint: "Trækker renten på prioritetslånet ned." },
      { key: "energiRate", label: "Energilånet", min: 0, max: 0.08, step: 0.0001, nudge: 0.0025, fmt: p2 },
      { key: "suRate", label: "SU-lånet", min: 0, max: 0.06, step: 0.0001, nudge: 0.0025, fmt: p2, hint: "Højere rente gør, at lånet tager længere tid at betale ud." },
    ],
  },
  {
    id: "opsparing",
    title: "Løn og opsparing",
    sub: "Det, vi selv sætter ind hver måned",
    fields: [
      { key: "salaryGrowth", label: "Lønstigning om året", min: 0, max: 0.06, step: 0.0025, nudge: 0.005, fmt: p2, hint: "Hæver pension og Nordnet i samme takt." },
      { key: "nordnetEmil", label: "Emil til Nordnet", min: 0, max: 15_000, step: 500, fmt: md, color: BLUE },
      { key: "nordnetFrederikke", label: "Frederikke til Nordnet", min: 0, max: 15_000, step: 500, fmt: md, color: CARAMEL },
      {
        key: "nordnetCutAfterMove", label: "Mindre i Nordnet efter flytningen", min: -3_000, max: 6_000, step: 100, fmt: md,
        hint: "Pr. person ved planens hus og rente. Et dyrere lån lægges selv oveni.",
      },
      { key: "askShare", label: "Andel på aktiesparekonto", min: 0, max: 1, step: 0.1, fmt: p0, color: MINT, hint: "Til loftet er nået. Resten går i frit depot." },
    ],
    special: ["suToNordnet"],
  },
  {
    id: "pension",
    title: "Pension",
    sub: "Indbetalt via lønnen hver måned",
    fields: [
      { key: "pensionEmil", label: "Emil", min: 0, max: 20_000, step: 1, nudge: 250, fmt: md, color: BLUE },
      { key: "pensionFrederikke", label: "Frederikke", min: 0, max: 20_000, step: 1, nudge: 250, fmt: md, color: CARAMEL },
    ],
  },
  {
    id: "skat",
    title: "Skat",
    sub: "Reglerne for 2026",
    fields: [
      { key: "taxLow", label: "Aktieskat, lav sats", min: 0.15, max: 0.4, step: 0.01, fmt: p0, color: CORAL },
      { key: "taxHigh", label: "Aktieskat, høj sats", min: 0.3, max: 0.6, step: 0.01, fmt: p0, color: CORAL },
      { key: "taxThreshold", label: "Grænse for lav sats", min: 40_000, max: 150_000, step: 100, nudge: 1_000, fmt: kr, hint: "Gevinst pr. person." },
      { key: "askRate", label: "Skat på aktiesparekonto", min: 0.1, max: 0.3, step: 0.01, fmt: p0, color: CORAL },
    ],
  },
  { id: "koeb", title: "Engangskøb", sub: "Fx en bil eller et nyt køkken", fields: [], special: ["events"] },
];

/** Hvor mange ting i en gruppe, der afviger fra planen */
export function changedIn(g: Group, d: ScenarioParams, plan: ScenarioParams) {
  let n = g.fields.filter((f) => Math.abs(d[f.key] - plan[f.key]) > f.step / 2).length;
  if (g.special?.includes("saleYear") && d.saleMonth !== plan.saleMonth) n++;
  if (g.special?.includes("suToNordnet") && d.suToNordnet !== plan.suToNordnet) n++;
  if (g.special?.includes("events") && JSON.stringify(d.events ?? []) !== JSON.stringify(plan.events ?? [])) n++;
  return n;
}

export const changedCount = (d: ScenarioParams, plan: ScenarioParams) => GROUPS.reduce((a, g) => a + changedIn(g, d, plan), 0);
