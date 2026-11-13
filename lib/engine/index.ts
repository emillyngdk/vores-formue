/**
 * Regnemotoren. Ren TypeScript uden UI-afhængigheder.
 * Månedlig simulering fra oktober 2026 (måned 0) til oktober 2035 (måned 108).
 * Status gemmes hver oktober. Alle tal i DKK, nominelt.
 */
import { loans, monthlyFlow, people, plan, snapshot, taxRules2026 } from "@/data/household";

export const START_YEAR = 2026;
export const YEARS = 9;

export type EventPay = "konto" | "aktier" | "laan";

/** Et engangskøb, fx en bil. Regnes som en ren udgift: det købte tælles ikke med i formuen. */
export interface PlanEvent {
  id: string;
  label: string;
  amount: number;
  year: number; // købet sker i januar det år (2027–2035)
  pay: EventPay; // PrioritetsKonto (resten fra aktier), aktier eller lån
  loanYears: number;
  loanRate: number;
  on: boolean;
}

export const EVENT_YEARS = [2027, 2035] as const;
export const eventMonth = (year: number) => (year - 2027) * 12 + 3;
export const loanPayment = (amount: number, rate: number, years: number) => {
  const n = Math.max(1, Math.round(years * 12));
  const r = rate / 12;
  return r === 0 ? amount / n : (amount * r) / (1 - (1 + r) ** -n);
};

export interface ScenarioParams {
  // Afkast og boligpriser
  stockReturn: number; // aktieafkast p.a.
  pensionReturn: number; // pensionsafkast p.a.
  apartmentGrowth: number; // lejlighedens prisudvikling p.a. frem til salget (0 i basis)
  houseGrowth: number; // husprisvækst p.a. efter købet
  // Bolighandlen
  apartmentValue: number; // lejlighedens værdi i dag
  housePrice: number;
  saleMonth: number; // måneder efter oktober 2026 (24 = oktober 2028)
  downPaymentPct: number; // udbetaling på huset
  salaer: number;
  purchaseCosts: number;
  movingCosts: number;
  cashAfterSale: number; // pr. person på egen konto efter salget, resten i aktier
  // Lån og renter
  newLoanRate: number; // nyt realkreditlån på huset, rente og bidrag p.a.
  prioRate: number; // prioritetslånet
  kontoRate: number; // rente på PrioritetsKontoen
  energiRate: number;
  suRate: number;
  // Løn og opsparing
  salaryGrowth: number; // p.a., løfter pension og Nordnet-opsparing i samme takt (0 i basis)
  nordnetEmil: number;
  nordnetFrederikke: number;
  nordnetCutAfterMove: number; // pr. person pr. måned ved planens hus og rente. Justeres selv for husets pris, udbetaling og rente.
  askShare: number; // andel af månedsopsparingen, der går på aktiesparekonto (0–1), til loftet er nået
  suToNordnet: boolean; // Frederikkes 1.257 kr. til Nordnet, når SU-lånet er betalt
  // Pension pr. måned
  pensionEmil: number;
  pensionFrederikke: number;
  // Skat
  taxLow: number;
  taxHigh: number;
  taxThreshold: number;
  askRate: number;
  events?: PlanEvent[];
}

export const BASE: ScenarioParams = {
  stockReturn: 0.07,
  pensionReturn: 0.04,
  apartmentGrowth: 0,
  houseGrowth: 0.035,
  apartmentValue: plan.apartmentSalePrice,
  housePrice: plan.housePrice,
  saleMonth: plan.saleMonth,
  downPaymentPct: plan.downPaymentPct,
  salaer: plan.salaer,
  purchaseCosts: plan.purchaseCosts,
  movingCosts: plan.movingCosts,
  cashAfterSale: plan.cashPerPersonAfterSale,
  newLoanRate: plan.newRealkreditRate,
  prioRate: loans.prioritetslaan.rate,
  kontoRate: loans.prioritetslaan.kontoRate,
  energiRate: loans.energilaan.rate,
  suRate: loans.suLoan.rate,
  salaryGrowth: 0,
  nordnetEmil: monthlyFlow.nordnet.emil,
  nordnetFrederikke: monthlyFlow.nordnet.frederikke,
  nordnetCutAfterMove: plan.nordnetCutAfterMove,
  askShare: 0,
  suToNordnet: false,
  pensionEmil: people.emil.pensionMonthly,
  pensionFrederikke: people.frederikke.pensionMonthly,
  taxLow: taxRules2026.shareIncome.low,
  taxHigh: taxRules2026.shareIncome.high,
  taxThreshold: taxRules2026.shareIncome.threshold,
  askRate: taxRules2026.aktiesparekonto.rate,
};

/** Rente og bidrag på det nye realkreditlån pr. måned */
export const housingCostMonthly = (housePrice: number, downPaymentPct = BASE.downPaymentPct, rate = BASE.newLoanRate) =>
  (housePrice * (1 - downPaymentPct) * rate) / 12;

/**
 * Hvor meget hver af os sætter mindre i Nordnet efter flytningen.
 * Planens 1.300 kr. gælder planens hus og rente. Et dyrere lån koster mere om måneden, og forskellen deles mellem os.
 * Bliver tallet negativt, er huset billigere end planen, og vi kan sætte mere ind.
 */
export const effectiveCut = (p: ScenarioParams) =>
  Math.round(p.nordnetCutAfterMove + (housingCostMonthly(p.housePrice, p.downPaymentPct, p.newLoanRate) - housingCostMonthly(BASE.housePrice)) / 2);

/** Ekstra udgift pr. måned på prioritetslånet i forhold til planens renter (negativ = billigere) */
export const prioExtraMonthly = (p: ScenarioParams, principal: number, konto: number) =>
  (principal * (p.prioRate - BASE.prioRate) - konto * (p.kontoRate - BASE.kontoRate)) / 12;

export const PRESETS = {
  forsigtig: { ...BASE, apartmentValue: 6_750_000, houseGrowth: 0.015, stockReturn: 0.05, pensionReturn: 0.03 },
  basis: { ...BASE },
  god: { ...BASE, houseGrowth: 0.045, stockReturn: 0.09, pensionReturn: 0.05 },
} satisfies Record<string, ScenarioParams>;

/** Uden de ekstra 2.000 kr./md pr. person og uden nedskæring efter flytning */
export const WITHOUT_EXTRA: ScenarioParams = {
  ...BASE,
  nordnetEmil: 4_000,
  nordnetFrederikke: 5_000,
  nordnetCutAfterMove: 0,
};

type TaxRules = Pick<ScenarioParams, "taxLow" | "taxHigh" | "taxThreshold">;

/** Skat på aktiegevinst, som hvis alt blev solgt. Pr. person. */
export function shareTax(value: number, basis: number, r: TaxRules = BASE): number {
  const gain = Math.max(value - basis, 0);
  return Math.min(gain, r.taxThreshold) * r.taxLow + Math.max(gain - r.taxThreshold, 0) * r.taxHigh;
}

const FLOW_KEYS = [
  "emilStocksIn", "frederikkeStocksIn",
  "emilStocksReturn", "frederikkeStocksReturn",
  "emilStocksFromSale", "frederikkeStocksFromSale",
  "emilPensionIn", "frederikkePensionIn",
  "emilPensionReturn", "frederikkePensionReturn",
  "houseGrowth", "energilaanPaid", "suPaid", "prioritetsKontoIn", "housingTransaction", "askTax",
  "eventsOut", "eventsTax", "otherCosts",
] as const;
export type FlowKey = (typeof FLOW_KEYS)[number];
export type Flows = Record<FlowKey, number>;
const zeroFlows = (): Flows => Object.fromEntries(FLOW_KEYS.map((k) => [k, 0])) as Flows;

export interface PersonRow {
  stocksValue: number; // frit depot + aktiesparekonto
  askValue: number;
  stocksBasis: number;
  stocksTax: number;
  stocksNet: number;
  cash: number;
  pension: number;
  suLoan: number;
  equityShare: number; // ½ friværdi
  kontoShare: number; // ½ PrioritetsKonto
  wealth: number; // uden pension
  wealthWithPension: number;
}

export interface YearRow {
  year: number;
  ownsHouse: boolean;
  homeValue: number;
  realkredit: number;
  prioritetslaan: number;
  energilaan: number;
  debt: number;
  salaer: number;
  equity: number; // friværdi
  prioritetsKonto: number;
  emil: PersonRow;
  frederikke: PersonRow;
  stocksNet: number;
  pension: number;
  accounts: number; // konti − SU
  wealth: number; // samlet uden pension
  wealthWithPension: number;
  flowsYear: Flows; // strømme i året op til denne status
  flowsTotal: Flows; // akkumuleret siden oktober 2026
}

export interface SaleEvent {
  salePrice: number;
  salaer: number;
  realkredit: number;
  prioritetslaan: number;
  energilaan: number;
  prioritetsKonto: number;
  net: number;
  downPayment: number;
  purchaseCosts: number;
  movingCosts: number;
  surplus: number;
  perPerson: number;
  cashPerPerson: number;
  stocksPerPerson: number;
  newRealkredit: number;
  housePrice: number;
}

export interface MonthPoint {
  m: number; // måneder efter oktober 2026
  emilStocks: number;
  frederikkeStocks: number;
  prioritetsKonto: number;
  emilPension: number;
  frederikkePension: number;
}

export interface EventOutcome {
  id: string;
  label: string;
  year: number;
  amount: number;
  pay: EventPay;
  fromKonto: number;
  fromStocks: number; // efter skat
  tax: number; // skat udløst ved salget af aktier
  monthly: number; // ydelse på lånet
  months: number; // lånets løbetid i måneder
  paid: number; // betalt på lånet frem til oktober 2035
  shortfall: number; // det, der ikke kunne dækkes af konto, aktier eller opsparing
}

export interface SimulationResult {
  params: ScenarioParams;
  rows: YearRow[];
  monthly: MonthPoint[];
  sale: SaleEvent | null;
  suPaidOffMonth: number | null;
  events: EventOutcome[];
}

export function simulate(params: ScenarioParams = BASE): SimulationResult {
  const p = params;
  const am = (1 + p.stockReturn) ** (1 / 12) - 1;
  const pm = (1 + p.pensionReturn) ** (1 / 12) - 1;
  const hm = (1 + p.houseGrowth) ** (1 / 12);
  const apm = (1 + p.apartmentGrowth) ** (1 / 12);
  const cut = effectiveCut(p);

  const s = {
    // Lejligheden er det værd, vi regner med at sælge den for. Så følger formuen i dag med, når prisen ændres.
    home: p.apartmentValue,
    rk: snapshot.shared.realkredit as number,
    prio: snapshot.shared.prioritetslaan as number,
    el: snapshot.shared.energilaan as number,
    konto: snapshot.shared.prioritetsKonto as number,
    ea: snapshot.emil.nordnetValue as number,
    eb: snapshot.emil.nordnetBasis as number,
    fa: snapshot.frederikke.nordnetValue as number,
    fb: snapshot.frederikke.nordnetBasis as number,
    eCash: snapshot.emil.cash as number,
    fCash: snapshot.frederikke.cash as number,
    su: snapshot.frederikke.suLoan as number,
    ep: snapshot.emil.pension as number,
    fp: snapshot.frederikke.pension as number,
    house: false,
    // aktiesparekonto: værdi, indskud i alt, referenceværdi for årets skat, fremført tab
    eAsk: 0, fAsk: 0, eAskDep: 0, fAskDep: 0, eAskRef: 0, fAskRef: 0, eAskLoss: 0, fAskLoss: 0,
  };

  let yearFlows = zeroFlows();
  const total = zeroFlows();
  const add = (k: FlowKey, v: number) => {
    yearFlows[k] += v;
    total[k] += v;
  };

  const rows: YearRow[] = [];
  let sale: SaleEvent | null = null;
  let suPaidOffMonth: number | null = null;

  // Engangskøb
  const outcomes: EventOutcome[] = (p.events ?? [])
    .filter((e) => e.on && e.amount > 0)
    .map((e) => ({
      id: e.id, label: e.label, year: e.year, amount: e.amount, pay: e.pay, fromKonto: 0, fromStocks: 0, tax: 0,
      monthly: e.pay === "laan" ? loanPayment(e.amount, e.loanRate, e.loanYears) : 0,
      months: e.pay === "laan" ? Math.max(1, Math.round(e.loanYears * 12)) : 0,
      paid: 0, shortfall: 0,
    }));

  /** Sælger aktier hos én person, så formuen falder med højst `want`. Skatten følger modellen: som om gevinsten blev realiseret. */
  const sellFrom = (who: "e" | "f", want: number, o: EventOutcome): number => {
    if (want <= 0) return 0;
    const V = who === "e" ? s.ea : s.fa;
    const B = who === "e" ? s.eb : s.fb;
    const full = V - shareTax(V, B, p);
    let got = 0;
    if (V > 0) {
      let G = V;
      if (want < full) {
        let lo = 0;
        let hi = V;
        for (let i = 0; i < 50; i++) {
          const mid = (lo + hi) / 2;
          const left = V - mid - shareTax(V - mid, B * (1 - mid / V), p);
          if (full - left < want) lo = mid;
          else hi = mid;
        }
        G = hi;
      }
      const net = Math.min(want, full);
      const keep = 1 - G / V;
      if (who === "e") { s.ea = V - G; s.eb = B * keep; } else { s.fa = V - G; s.fb = B * keep; }
      add("eventsOut", -net);
      add("eventsTax", -(G - net));
      o.fromStocks += net;
      o.tax += G - net;
      got = net;
    }
    // Derefter aktiesparekontoen, som allerede er beskattet
    const ask = who === "e" ? s.eAsk : s.fAsk;
    const take = Math.min(ask, want - got);
    if (take > 0) {
      if (who === "e") { s.eAsk -= take; s.eAskRef -= take; } else { s.fAsk -= take; s.fAskRef -= take; }
      add("eventsOut", -take);
      o.fromStocks += take;
      got += take;
    }
    return got;
  };
  /** Deler regningen ligeligt. Har den ene ikke nok, dækker den anden. Resten trækkes på kontiene. */
  const sell = (want: number, o: EventOutcome) => {
    let left = want;
    left -= sellFrom("e", want / 2, o);
    left -= sellFrom("f", left, o);
    left -= sellFrom("e", left, o);
    if (left > 0.5) {
      s.eCash -= left / 2;
      s.fCash -= left / 2;
      add("eventsOut", -left);
      o.shortfall += left;
    }
  };

  const monthly: MonthPoint[] = [];
  const point = (m: number) =>
    monthly.push({
      m, emilStocks: s.ea + s.eAsk, frederikkeStocks: s.fa + s.fAsk, prioritetsKonto: s.konto,
      emilPension: s.ep, frederikkePension: s.fp,
    });

  const person = (
    depot: number, basis: number, ask: number, cash: number, pension: number, su: number, equity: number, konto: number,
  ): PersonRow => {
    const tax = shareTax(depot, basis, p);
    const net = depot - tax + ask;
    const wealth = equity / 2 + konto / 2 + net + cash - su;
    return {
      stocksValue: depot + ask, askValue: ask, stocksBasis: basis, stocksTax: tax, stocksNet: net, cash, pension, suLoan: su,
      equityShare: equity / 2, kontoShare: konto / 2, wealth, wealthWithPension: wealth + pension,
    };
  };

  const snap = (year: number) => {
    const debt = s.rk + s.prio + s.el;
    const salaer = s.house ? 0 : p.salaer;
    const equity = s.home - debt - salaer;
    const emil = person(s.ea, s.eb, s.eAsk, s.eCash, s.ep, 0, equity, s.konto);
    const frederikke = person(s.fa, s.fb, s.fAsk, s.fCash, s.fp, s.su, equity, s.konto);
    const wealth = emil.wealth + frederikke.wealth;
    rows.push({
      year, ownsHouse: s.house, homeValue: s.home, realkredit: s.rk, prioritetslaan: s.prio, energilaan: s.el,
      debt, salaer, equity, prioritetsKonto: s.konto, emil, frederikke,
      stocksNet: emil.stocksNet + frederikke.stocksNet,
      pension: s.ep + s.fp,
      accounts: s.konto + s.eCash + s.fCash - s.su,
      wealth, wealthWithPension: wealth + s.ep + s.fp,
      flowsYear: { ...yearFlows }, flowsTotal: { ...total },
    });
    yearFlows = zeroFlows();
  };

  snap(START_YEAR);
  point(0);

  for (let m = 1; m <= 12 * YEARS; m++) {
    // 1. Afkast
    let a = s.ea * am; add("emilStocksReturn", a); s.ea += a;
    a = s.fa * am; add("frederikkeStocksReturn", a); s.fa += a;
    a = s.eAsk * am; add("emilStocksReturn", a); s.eAsk += a;
    a = s.fAsk * am; add("frederikkeStocksReturn", a); s.fAsk += a;
    a = s.ep * pm; add("emilPensionReturn", a); s.ep += a;
    a = s.fp * pm; add("frederikkePensionReturn", a); s.fp += a;

    // 2. Indbetalinger
    const salaryFactor = (1 + p.salaryGrowth) ** Math.floor((m - 1) / 12);
    let eIn = p.nordnetEmil;
    let fIn = p.nordnetFrederikke;
    if (s.house) { eIn -= cut; fIn -= cut; }
    eIn = Math.max(0, eIn) * salaryFactor;
    fIn = Math.max(0, fIn) * salaryFactor;
    if (p.suToNordnet && suPaidOffMonth !== null) fIn += loans.suLoan.monthly;
    // Andre renter på prioritetslånet ændrer, hvad der er tilbage til Nordnet. Rækker opsparingen ikke, går resten fra kontiene.
    if (!s.house && s.prio > 0 && (p.prioRate !== BASE.prioRate || p.kontoRate !== BASE.kontoRate)) {
      const extra = prioExtraMonthly(p, s.prio, s.konto);
      if (extra < 0) { eIn -= extra / 2; fIn -= extra / 2; }
      else {
        let left = extra;
        const e1 = Math.min(eIn, left / 2); eIn -= e1; left -= e1;
        const f1 = Math.min(fIn, left); fIn -= f1; left -= f1;
        const e2 = Math.min(eIn, left); eIn -= e2; left -= e2;
        if (left > 0.005) { s.eCash -= left / 2; s.fCash -= left / 2; add("otherCosts", -left); }
      }
    }
    // Ydelser på lån til engangskøb går fra månedsopsparingen, ligeligt fordelt
    for (const o of outcomes) {
      const start = eventMonth(o.year);
      if (o.pay !== "laan" || m <= start || m > start + o.months) continue;
      o.paid += o.monthly;
      let left = o.monthly;
      const e1 = Math.min(eIn, left / 2); eIn -= e1; left -= e1;
      const f1 = Math.min(fIn, left); fIn -= f1; left -= f1;
      const e2 = Math.min(eIn, left); eIn -= e2; left -= e2;
      if (left > 0.5) sell(left, o);
    }
    // Aktiesparekonto: forenklet. Indskud op til loftet, resten i frit depot.
    const cap = m <= 2 ? taxRules2026.aktiesparekonto.depositCap2026 : taxRules2026.aktiesparekonto.depositCap2027;
    const eAskIn = Math.max(0, Math.min(eIn * p.askShare, cap - s.eAskDep));
    const fAskIn = Math.max(0, Math.min(fIn * p.askShare, cap - s.fAskDep));
    s.eAsk += eAskIn; s.eAskDep += eAskIn; s.eAskRef += eAskIn;
    s.fAsk += fAskIn; s.fAskDep += fAskIn; s.fAskRef += fAskIn;
    s.ea += eIn - eAskIn; s.eb += eIn - eAskIn; s.fa += fIn - fAskIn; s.fb += fIn - fAskIn;
    add("emilStocksIn", eIn); add("frederikkeStocksIn", fIn);

    const epIn = p.pensionEmil * salaryFactor;
    const fpIn = p.pensionFrederikke * salaryFactor;
    s.ep += epIn; s.fp += fpIn; add("emilPensionIn", epIn); add("frederikkePensionIn", fpIn);

    // 3. SU-lån
    if (s.su > 0) {
      const next = Math.max(0, s.su * (1 + p.suRate / 12) - loans.suLoan.monthly);
      add("suPaid", s.su - next);
      s.su = next;
    }

    if (s.house) {
      // 6. Huset stiger
      const next = s.home * hm;
      add("houseGrowth", next - s.home);
      s.home = next;
    } else {
      // 4. Før salget
      if (p.apartmentGrowth !== 0) {
        const next = s.home * apm;
        add("houseGrowth", next - s.home);
        s.home = next;
      }
      if (m === plan.prioritetsKontoTopUpMonth) { s.konto += plan.prioritetsKontoTopUp; add("prioritetsKontoIn", plan.prioritetsKontoTopUp); }
      if (s.el > 0) {
        const next = Math.max(0, s.el * (1 + p.energiRate / 12) - loans.energilaan.monthly);
        add("energilaanPaid", s.el - next);
        s.el = next;
      }
      // 5. Salg og køb
      if (m === p.saleMonth) {
        const salePrice = s.home;
        const net = salePrice - p.salaer - s.rk - s.prio - s.el + s.konto;
        const downPayment = p.housePrice * p.downPaymentPct;
        const surplus = net - downPayment - p.purchaseCosts - p.movingCosts;
        const each = surplus / 2;
        const toStocks = each - p.cashAfterSale;
        sale = {
          salePrice, salaer: p.salaer, realkredit: s.rk, prioritetslaan: s.prio,
          energilaan: s.el, prioritetsKonto: s.konto, net, downPayment, purchaseCosts: p.purchaseCosts,
          movingCosts: p.movingCosts, surplus, perPerson: each, cashPerPerson: p.cashAfterSale,
          stocksPerPerson: toStocks, newRealkredit: p.housePrice - downPayment, housePrice: p.housePrice,
        };
        // Tabet ved handlen er omkostningerne. Lejligheden sælges til det, den er værd.
        add("housingTransaction", (salePrice - s.home) - p.purchaseCosts - p.movingCosts);
        s.eCash += p.cashAfterSale; s.fCash += p.cashAfterSale;
        // Mangler der penge, tages de fra depotet. Er det ikke nok, går resten fra kontoen.
        const toDepot = (v: number, who: "e" | "f") => {
          const V = who === "e" ? s.ea : s.fa;
          const B = who === "e" ? s.eb : s.fb;
          let use = v;
          if (V + use < 0) {
            if (who === "e") s.eCash += V + use; else s.fCash += V + use;
            use = -V;
          }
          if (who === "e") { s.ea = V + use; s.eb = Math.max(0, B + use); } else { s.fa = V + use; s.fb = Math.max(0, B + use); }
          add(who === "e" ? "emilStocksFromSale" : "frederikkeStocksFromSale", use);
        };
        toDepot(toStocks, "e");
        toDepot(toStocks, "f");
        s.home = p.housePrice; s.rk = p.housePrice - downPayment;
        s.prio = 0; s.el = 0; s.konto = 0; s.house = true;
      }
    }
    // 7. Engangskøb betalt med opsparing
    for (const o of outcomes) {
      if (o.pay === "laan" || eventMonth(o.year) !== m) continue;
      let left = o.amount;
      if (o.pay === "konto" && s.konto > 0) {
        const take = Math.min(s.konto, left);
        s.konto -= take;
        add("eventsOut", -take);
        o.fromKonto = take;
        left -= take;
      }
      if (left > 0) sell(left, o);
    }
    if (s.su === 0 && suPaidOffMonth === null) suPaidOffMonth = m;
    if (m % 12 === 0) {
      // Lagerbeskatning på aktiesparekontoen: 17 % af årets afkast, trukket fra kontoen
      const rate = p.askRate;
      const eTaxable = s.eAsk - s.eAskRef - s.eAskLoss;
      if (eTaxable > 0) { const t = eTaxable * rate; s.eAsk -= t; add("askTax", -t); s.eAskLoss = 0; } else s.eAskLoss = -eTaxable;
      s.eAskRef = s.eAsk;
      const fTaxable = s.fAsk - s.fAskRef - s.fAskLoss;
      if (fTaxable > 0) { const t = fTaxable * rate; s.fAsk -= t; add("askTax", -t); s.fAskLoss = 0; } else s.fAskLoss = -fTaxable;
      s.fAskRef = s.fAsk;
      snap(START_YEAR + m / 12);
    }
    point(m);
  }

  return { params: p, rows, monthly, sale, suPaidOffMonth, events: outcomes };
}

/** Hvor kommer væksten fra, fra første til sidste år */
export function growthBreakdown(result: SimulationResult) {
  const first = result.rows[0];
  const last = result.rows[result.rows.length - 1];
  const t = last.flowsTotal;
  const taxStart = first.emil.stocksTax + first.frederikke.stocksTax;
  const taxEnd = last.emil.stocksTax + last.frederikke.stocksTax;
  const parts = {
    stocksIn: t.emilStocksIn + t.frederikkeStocksIn,
    stocksReturn: t.emilStocksReturn + t.frederikkeStocksReturn,
    taxIfSold: -(taxEnd - taxStart) + t.askTax + t.eventsTax,
    pensionIn: t.emilPensionIn + t.frederikkePensionIn,
    pensionReturn: t.emilPensionReturn + t.frederikkePensionReturn,
    houseGrowth: t.houseGrowth,
    debtPaid: t.suPaid + t.energilaanPaid,
    prioritetsKontoIn: t.prioritetsKontoIn,
    housingTransaction: t.housingTransaction,
    events: t.eventsOut,
    otherCosts: t.otherCosts,
  };
  const sum = Object.values(parts).reduce((x, y) => x + y, 0);
  return { start: first.wealthWithPension, end: last.wealthWithPension, total: last.wealthWithPension - first.wealthWithPension, parts, sum };
}

export const SENSITIVITIES: { label: string; params: Partial<ScenarioParams> }[] = [
  { label: "Huspriser stiger 1 % (ikke 3,5 %)", params: { houseGrowth: 0.01 } },
  { label: "Lejligheden er 6,5 mio. værd", params: { apartmentValue: 6_500_000 } },
  { label: "Aktier giver 4 % (ikke 7 %)", params: { stockReturn: 0.04 } },
  { label: "Pension giver 2 % (ikke 4 %)", params: { pensionReturn: 0.02 } },
  { label: "Aktier giver 10 %", params: { stockReturn: 0.1 } },
  { label: "Huspriser stiger 5 %", params: { houseGrowth: 0.05 } },
];

/** Ændring i 2035-formuen (med pension) i forhold til basis */
export function sensitivity(base: ScenarioParams = BASE) {
  const baseEnd = last(simulate(base)).wealthWithPension;
  return SENSITIVITIES.map(({ label, params }) => ({
    label,
    delta: last(simulate({ ...base, ...params })).wealthWithPension - baseEnd,
  }));
}

export const last = (r: SimulationResult) => r.rows[r.rows.length - 1];
export const rowFor = (r: SimulationResult, year: number) => r.rows.find((x) => x.year === year);

/** Prioritetslånet: effektiv rente og nettorente pr. måned (før skat) ved en given saldo på PrioritetsKontoen */
export function prioritetslaanCost(konto: number) {
  const { principal, rate, kontoRate, boligrabat } = loans.prioritetslaan;
  const k = Math.min(Math.max(konto, 0), principal);
  const yearly = principal * rate - k * kontoRate - principal * boligrabat;
  return { effectiveRate: yearly / principal, monthly: yearly / 12, yearly };
}

/** Aktiesparekonto (17 % af årets afkast hvert år) mod frit depot (27 % eller 42 % ved salg) */
export function askVsDepot(amount: number, annualReturn: number, years: number) {
  const { rate } = taxRules2026.aktiesparekonto;
  const { low, high } = taxRules2026.shareIncome;
  const ask = amount * (1 + annualReturn * (1 - rate)) ** years;
  const gross = amount * (1 + annualReturn) ** years;
  const gain = gross - amount;
  return { ask, depotLow: amount + gain * (1 - low), depotHigh: amount + gain * (1 - high), gross };
}
