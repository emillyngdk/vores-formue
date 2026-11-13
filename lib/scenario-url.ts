import { BASE, EVENT_YEARS, type EventPay, type PlanEvent, type ScenarioParams } from "@/lib/engine";

type Key = Exclude<keyof ScenarioParams, "events">;

/** Korte nøgler, så et scenarie kan ligge i en URL: /lab?sr=0.09&sp=7350000 */
const KEYS: Record<Key, string> = {
  stockReturn: "sr", pensionReturn: "pr", houseGrowth: "hg", apartmentSalePrice: "sp", housePrice: "hp",
  saleMonth: "sm", nordnetEmil: "ne", nordnetFrederikke: "nf", nordnetCutAfterMove: "nc", salaryGrowth: "sg",
  suToNordnet: "su", askShare: "as",
};

const LIMITS: Record<Exclude<Key, "suToNordnet">, [number, number]> = {
  stockReturn: [-0.05, 0.2], pensionReturn: [-0.05, 0.15], houseGrowth: [-0.05, 0.15],
  apartmentSalePrice: [4_000_000, 12_000_000], housePrice: [3_000_000, 12_000_000], saleMonth: [12, 48],
  nordnetEmil: [0, 30_000], nordnetFrederikke: [0, 30_000], nordnetCutAfterMove: [0, 10_000],
  salaryGrowth: [0, 0.1], askShare: [0, 1],
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
  return sanitize(partial);
}

export const isBase = (p: ScenarioParams) => encodeScenario(p) === "";
