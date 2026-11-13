import { BASE, EVENT_YEARS, type EventPay, type PlanEvent, type ScenarioParams, housingCostMonthly } from "@/lib/engine";

type Key = Exclude<keyof ScenarioParams, "events">;

/** Korte nøgler, så et scenarie kan ligge i en URL: /lab?sr=0.09&sp=7350000 */
const KEYS: Record<Key, string> = {
  stockReturn: "sr", pensionReturn: "pr", apartmentGrowth: "ag", houseGrowth: "hg",
  apartmentValue: "sp", housePrice: "hp", saleMonth: "sm", downPaymentPct: "dp", salaer: "sa", purchaseCosts: "pc", movingCosts: "mc", cashAfterSale: "ca",
  newLoanRate: "nr", prioRate: "rp", kontoRate: "rk", energiRate: "re", suRate: "rs",
  salaryGrowth: "sg", nordnetEmil: "ne", nordnetFrederikke: "nf", nordnetCutAfterMove: "nb", askShare: "as", suToNordnet: "su",
  pensionEmil: "pe", pensionFrederikke: "pf",
  taxLow: "tl", taxHigh: "th", taxThreshold: "tt", askRate: "ar",
};

export const LIMITS: Record<Exclude<Key, "suToNordnet">, [number, number]> = {
  stockReturn: [-0.05, 0.2], pensionReturn: [-0.05, 0.15], apartmentGrowth: [-0.1, 0.2], houseGrowth: [-0.05, 0.15],
  apartmentValue: [3_000_000, 12_000_000], housePrice: [3_000_000, 12_000_000], saleMonth: [12, 48],
  downPaymentPct: [0.05, 0.8], salaer: [0, 300_000], purchaseCosts: [0, 500_000], movingCosts: [0, 300_000], cashAfterSale: [0, 1_000_000],
  newLoanRate: [0, 0.12], prioRate: [0, 0.15], kontoRate: [0, 0.12], energiRate: [0, 0.12], suRate: [0, 0.1],
  salaryGrowth: [0, 0.1], nordnetEmil: [0, 30_000], nordnetFrederikke: [0, 30_000], nordnetCutAfterMove: [-10_000, 10_000], askShare: [0, 1],
  pensionEmil: [0, 40_000], pensionFrederikke: [0, 40_000],
  taxLow: [0, 0.6], taxHigh: [0, 0.7], taxThreshold: [0, 500_000], askRate: [0, 0.5],
};

/** Holder alle værdier inden for fornuftige grænser. Bruges også på input fra assistenten. */
export function sanitize(input: Partial<ScenarioParams>): ScenarioParams {
  const out: ScenarioParams = { ...BASE };
  for (const k of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const v = input[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      const [lo, hi] = LIMITS[k];
      out[k] = Math.min(hi, Math.max(lo, v));
    }
  }
  out.saleMonth = Math.round(out.saleMonth / 12) * 12;
  if (typeof input.suToNordnet === "boolean") out.suToNordnet = input.suToNordnet;
  const events = sanitizeEvents(input.events);
  if (events.length) out.events = events;
  return out;
}

const PAYS: Record<string, EventPay> = { k: "konto", a: "aktier", l: "laan" };
const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

export function sanitizeEvents(input: unknown): PlanEvent[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 6).flatMap((raw, i) => {
    if (!raw || typeof raw !== "object") return [];
    const e = raw as Partial<PlanEvent>;
    const pay: EventPay = e.pay === "konto" || e.pay === "aktier" || e.pay === "laan" ? e.pay : "aktier";
    return [{
      id: typeof e.id === "string" && e.id ? e.id.slice(0, 24) : `e${i + 1}`,
      label: (typeof e.label === "string" ? e.label : "").replace(/[~|]/g, " ").trim().slice(0, 24) || "Køb",
      amount: Math.round(clamp(e.amount, 0, 3_000_000, 0)),
      year: Math.round(clamp(e.year, EVENT_YEARS[0], EVENT_YEARS[1], EVENT_YEARS[0])),
      pay,
      loanYears: Math.round(clamp(e.loanYears, 1, 15, 7)),
      loanRate: clamp(e.loanRate, 0, 0.15, 0.05),
      on: e.on !== false,
    }];
  });
}

const encodeEvents = (events: PlanEvent[]) =>
  events.map((e) => [e.label, e.amount, e.year, e.pay[0], e.loanYears, +e.loanRate.toFixed(4), e.on ? 1 : 0].join("~")).join("|");

const decodeEvents = (raw: string) =>
  raw.split("|").map((part, i) => {
    const [label, amount, year, pay, loanYears, loanRate, on] = part.split("~");
    return { id: `e${i + 1}`, label, amount: Number(amount), year: Number(year), pay: PAYS[pay], loanYears: Number(loanYears), loanRate: Number(loanRate), on: on !== "0" };
  });

export function encodeScenario(p: ScenarioParams): string {
  const q = new URLSearchParams();
  for (const k of Object.keys(KEYS) as Key[]) {
    if (p[k] !== BASE[k]) q.set(KEYS[k], typeof p[k] === "boolean" ? (p[k] ? "1" : "0") : String(+(+p[k]).toFixed(4)));
  }
  if (p.events?.length) q.set("ev", encodeEvents(p.events));
  return q.toString();
}

export function decodeScenario(search: string): ScenarioParams {
  const q = new URLSearchParams(search);
  const partial: Partial<ScenarioParams> = {};
  for (const k of Object.keys(KEYS) as Key[]) {
    const raw = q.get(KEYS[k]);
    if (raw === null) continue;
    if (k === "suToNordnet") partial.suToNordnet = raw === "1";
    else partial[k] = Number(raw);
  }
  const ev = q.get("ev");
  if (ev) partial.events = decodeEvents(ev);
  // Ældre adresser og gemte planer: "nc" var Nordnet-nedskæringen inklusive tillægget for husets pris
  const legacy = q.get("nc");
  if (legacy !== null && q.get("nb") === null) {
    const hp = partial.housePrice ?? BASE.housePrice;
    partial.nordnetCutAfterMove = Number(legacy) - Math.round((housingCostMonthly(hp) - housingCostMonthly(BASE.housePrice)) / 2);
  }
  return sanitize(partial);
}

export const isBase = (p: ScenarioParams) => encodeScenario(p) === "";
