import { describe, expect, it } from "vitest";
import {
  BASE, PRESETS, WITHOUT_EXTRA, askVsDepot, growthBreakdown, last, nordnetCutFor, prioritetslaanCost, rowFor, sensitivity, shareTax, simulate,
} from "./index";
import { decodeScenario, encodeScenario, sanitize } from "../scenario-url";
import { kr, mio, pct } from "../format";

const TOL = 1_000;
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `forventet ${expected}, fik ${Math.round(actual)}`).toBeLessThanOrEqual(TOL);

// Afsnit 6.4: [år, Emil u.p., Frederikke u.p., samlet u.p., pension, samlet m.p., friværdi, aktier e. skat, konti − SU]
const FIXTURES: [number, number, number, number, number, number, number, number, number][] = [
  [2026, 1_704_974, 1_391_835, 3_096_809, 414_206, 3_511_015, 2_430_000, 434_729, 232_080],
  [2027, 1_804_071, 1_502_185, 3_306_256, 630_314, 3_936_569, 2_437_985, 616_585, 251_686],
  [2028, 1_848_904, 1_558_303, 3_407_207, 855_066, 4_262_273, 1_300_000, 1_954_649, 152_558],
  [2029, 2_068_515, 1_798_086, 3_866_601, 1_088_808, 4_955_408, 1_527_500, 2_172_880, 166_220],
  [2030, 2_295_232, 2_039_139, 4_334_371, 1_331_899, 5_666_270, 1_762_963, 2_391_132, 180_277],
  [2031, 2_532_041, 2_290_356, 4_822_397, 1_584_715, 6_407_112, 2_006_666, 2_620_991, 194_740],
  [2032, 2_779_504, 2_551_340, 5_330_844, 1_847_643, 7_178_487, 2_258_900, 2_863_272, 208_673],
  [2033, 3_038_217, 2_809_260, 5_847_477, 2_121_088, 7_968_565, 2_519_961, 3_118_843, 208_673],
  [2034, 3_308_813, 3_078_654, 6_387_468, 2_405_470, 8_792_938, 2_790_160, 3_388_635, 208_673],
  [2035, 3_591_964, 3_360_167, 6_952_131, 2_701_229, 9_653_360, 3_069_815, 3_673_643, 208_673],
];

describe("basis-scenariet år for år (afsnit 6.4)", () => {
  const result = simulate(BASE);
  it("har 10 årsrækker 2026–2035", () => {
    expect(result.rows.map((r) => r.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]);
  });
  for (const [year, e, f, t, pen, tp, eq, akt, kont] of FIXTURES) {
    it(`${year}`, () => {
      const r = rowFor(result, year)!;
      near(r.emil.wealth, e);
      near(r.frederikke.wealth, f);
      near(r.wealth, t);
      near(r.pension, pen);
      near(r.wealthWithPension, tp);
      near(r.equity, eq);
      near(r.stocksNet, akt);
      near(r.accounts, kont);
    });
  }
});

describe("salget i oktober 2028", () => {
  const sale = simulate(BASE).sale!;
  it("rammer testtallene", () => {
    near(sale.realkredit, 3_873_000);
    near(sale.prioritetslaan, 540_000);
    near(sale.energilaan, 65_731);
    near(sale.prioritetsKonto, 212_407);
    near(sale.net, 2_658_676);
    near(sale.surplus, 1_246_426);
    near(sale.perPerson, 623_213);
  });
  it("SU-lånet er betalt ud i oktober 2032 (måned 72)", () => {
    expect(simulate(BASE).suPaidOffMonth).toBe(72);
  });
});

describe("vækst 2026 → 2035", () => {
  const g = growthBreakdown(simulate(BASE));
  it("summen af posterne går op", () => {
    near(g.total, 6_142_345);
    near(g.sum, g.total);
  });
  it("hver post", () => {
    near(g.parts.stocksIn, 1_185_600);
    near(g.parts.stocksReturn, 1_523_144);
    near(g.parts.taxIfSold, -616_256);
    near(g.parts.pensionIn, 1_763_748);
    near(g.parts.pensionReturn, 523_275);
    near(g.parts.houseGrowth, 1_769_815);
    near(g.parts.debtPaid, 98_569);
    near(g.parts.prioritetsKontoIn, 6_700);
    near(g.parts.housingTransaction, -112_250);
  });
});

describe("scenarier 2035 (med pension)", () => {
  it("Forsigtig", () => near(last(simulate(PRESETS.forsigtig)).wealthWithPension, 7_854_352));
  it("Basis", () => near(last(simulate(PRESETS.basis)).wealthWithPension, 9_653_360));
  it("God", () => near(last(simulate(PRESETS.god)).wealthWithPension, 10_708_637));
});

describe("ekstra-testen", () => {
  it("uden de ekstra 2.000 kr./md er 2031 ca. 167.000 kr. lavere", () => {
    const diff = rowFor(simulate(BASE), 2031)!.wealthWithPension - rowFor(simulate(WITHOUT_EXTRA), 2031)!.wealthWithPension;
    expect(diff).toBeGreaterThan(160_000);
    expect(diff).toBeLessThan(175_000);
  });
});

describe("følsomhed og skat", () => {
  it("følsomhed giver 6 poster med de rigtige fortegn", () => {
    const s = sensitivity();
    expect(s).toHaveLength(6);
    expect(s.find((x) => x.label.startsWith("Aktier giver 10"))!.delta).toBeGreaterThan(0);
    expect(s.find((x) => x.label.startsWith("Huspriser stiger 1"))!.delta).toBeLessThan(0);
  });
  it("aktieskat 27/42 % med grænse 79.400 kr.", () => {
    expect(shareTax(100_000, 100_000)).toBe(0);
    expect(shareTax(179_400, 100_000)).toBeCloseTo(79_400 * 0.27);
    expect(shareTax(200_000, 100_000)).toBeCloseTo(79_400 * 0.27 + 20_600 * 0.42);
  });
});

describe("danske formater", () => {
  it("kr, mio og procent", () => {
    expect(kr(3_511_015)).toBe("3.511.015 kr.");
    expect(mio(6_407_112)).toBe("6,41 mio. kr.");
    expect(pct(0.0477)).toBe("4,77 %");
  });
});

describe("prioritetslånet", () => {
  it("effektiv rente ca. 2,97 % med 205.707 kr. på kontoen", () => {
    expect(prioritetslaanCost(205_707).effectiveRate).toBeCloseTo(0.0297, 4);
  });
  it("hver 10.000 kr. koster ca. 34 kr./md", () => {
    expect(prioritetslaanCost(195_707).monthly - prioritetslaanCost(205_707).monthly).toBeCloseTo(33.9, 0);
  });
});

describe("aktiesparekonto", () => {
  it("100.000 kr., 7 %, 9 år: ca. 166.000 / 161.000 / 149.000", () => {
    const r = askVsDepot(100_000, 0.07, 9);
    expect(Math.round(r.ask / 1000)).toBe(166);
    expect(Math.round(r.depotLow / 1000)).toBe(161);
    expect(Math.round(r.depotHigh / 1000)).toBe(149);
  });
  it("andel på aktiesparekonto giver højere formue, og væksten går stadig op", () => {
    const withAsk = simulate({ ...BASE, askShare: 1 });
    expect(last(withAsk).wealthWithPension).toBeGreaterThan(last(simulate(BASE)).wealthWithPension);
    const g = growthBreakdown(withAsk);
    expect(Math.abs(g.sum - g.total)).toBeLessThan(1);
    // indskud stopper ved loftet
    expect(last(withAsk).emil.askValue).toBeGreaterThan(179_300);
    expect(last(withAsk).emil.askValue).toBeLessThan(400_000);
  });
});

describe("lab-parametre", () => {
  it("SU-pengene til Nordnet fra 2032 giver mere i 2035", () => {
    const a = last(simulate({ ...BASE, suToNordnet: true })).frederikke.wealth;
    expect(a - last(simulate(BASE)).frederikke.wealth).toBeGreaterThan(40_000);
  });
  it("salg i 2027 og 2030 kører igennem og går op", () => {
    for (const saleMonth of [12, 36, 48]) {
      const r = simulate({ ...BASE, saleMonth });
      const g = growthBreakdown(r);
      expect(r.sale).not.toBeNull();
      expect(Math.abs(g.sum - g.total)).toBeLessThan(1);
    }
  });
  it("månedsdata har 109 punkter og starter på status", () => {
    const m = simulate(BASE).monthly;
    expect(m).toHaveLength(109);
    expect(m[0].emilStocks).toBe(353_983);
    expect(m[3].prioritetsKonto).toBe(212_407);
  });
  it("scenarie-URL kan kodes og afkodes", () => {
    const p = sanitize({ stockReturn: 0.09, apartmentSalePrice: 7_350_000, housePrice: 7_100_000, suToNordnet: true });
    expect(decodeScenario(encodeScenario(p))).toEqual(p);
    expect(encodeScenario(BASE)).toBe("");
    expect(sanitize({ stockReturn: 99 }).stockReturn).toBe(0.2);
  });
});

describe("engangskøb", () => {
  const car = (over: Partial<import("./index").PlanEvent> = {}): import("./index").PlanEvent => ({
    id: "bil", label: "Bil", amount: 300_000, year: 2029, pay: "aktier", loanYears: 7, loanRate: 0.05, on: true, ...over,
  });
  const base = simulate(BASE);
  const sumsUp = (r: ReturnType<typeof simulate>) => {
    const g = growthBreakdown(r);
    expect(Math.abs(g.sum - g.total)).toBeLessThan(1);
  };

  it("uden køb er alt som i basis", () => {
    const r = simulate({ ...BASE, events: [] });
    expect(last(r).wealthWithPension).toBe(last(base).wealthWithPension);
    const off = simulate({ ...BASE, events: [car({ on: false })] });
    expect(last(off).wealthWithPension).toBe(last(base).wealthWithPension);
  });

  it("betalt med aktier: formuen falder med prisen i købsåret", () => {
    const r = simulate({ ...BASE, events: [car()] });
    expect(rowFor(r, 2028)!.wealth).toBeCloseTo(rowFor(base, 2028)!.wealth, 0);
    const o = r.events[0];
    expect(o.fromStocks).toBeCloseTo(300_000, 0);
    expect(o.shortfall).toBe(0);
    expect(o.tax).toBeGreaterThan(0);
    // I 2029 mangler prisen plus ni måneders afkast af den
    const drop = rowFor(base, 2029)!.wealth - rowFor(r, 2029)!.wealth;
    expect(drop).toBeGreaterThan(300_000);
    expect(drop).toBeLessThan(330_000);
    expect(last(base).wealthWithPension - last(r).wealthWithPension).toBeGreaterThan(drop);
    sumsUp(r);
  });

  it("betalt fra PrioritetsKontoen: tager kontoen først og resten fra aktierne", () => {
    const r = simulate({ ...BASE, events: [car({ year: 2027, pay: "konto" })] });
    const o = r.events[0];
    expect(o.fromKonto).toBeGreaterThan(200_000);
    expect(o.fromKonto + o.fromStocks).toBeCloseTo(300_000, 0);
    expect(rowFor(r, 2027)!.prioritetsKonto).toBeLessThan(1);
    // Mindre på kontoen ved salget giver mindre overskud
    expect(base.sale!.surplus - r.sale!.surplus).toBeCloseTo(o.fromKonto, 0);
    sumsUp(r);
  });

  it("med lån: ydelsen går fra Nordnet-opsparingen", () => {
    const r = simulate({ ...BASE, events: [car({ pay: "laan" })] });
    const o = r.events[0];
    near(o.monthly, 4_240);
    expect(o.months).toBe(84);
    // Januar 2029 til oktober 2035 er 81 ydelser
    expect(o.paid).toBeCloseTo(o.monthly * 81, 0);
    const fewer = last(base).flowsTotal.emilStocksIn + last(base).flowsTotal.frederikkeStocksIn - last(r).flowsTotal.emilStocksIn - last(r).flowsTotal.frederikkeStocksIn;
    expect(fewer).toBeCloseTo(o.paid, 0);
    expect(rowFor(r, 2028)!.wealth).toBeCloseTo(rowFor(base, 2028)!.wealth, 0);
    expect(last(r).wealthWithPension).toBeLessThan(last(base).wealthWithPension - o.paid);
    sumsUp(r);
  });

  it("et køb, der er større end aktierne, giver en mangel i stedet for negative aktier", () => {
    const r = simulate({ ...BASE, events: [car({ year: 2027, amount: 2_000_000 })] });
    const o = r.events[0];
    expect(o.shortfall).toBeGreaterThan(0);
    expect(rowFor(r, 2027)!.stocksNet).toBeGreaterThanOrEqual(0);
    expect(o.fromStocks + o.shortfall).toBeCloseTo(2_000_000, 0);
    sumsUp(r);
  });

  it("kan ligge i en adresse og komme uændret tilbage", () => {
    const p = { ...BASE, apartmentSalePrice: 6_500_000, events: [car({ pay: "laan", loanYears: 5, loanRate: 0.045 }), car({ id: "x", label: "Køkken", amount: 150_000, year: 2031, pay: "konto" })] };
    const back = decodeScenario(encodeScenario(p));
    expect(back.apartmentSalePrice).toBe(6_500_000);
    expect(back.events).toHaveLength(2);
    expect(back.events![0]).toMatchObject({ label: "Bil", amount: 300_000, year: 2029, pay: "laan", loanYears: 5, loanRate: 0.045, on: true });
    expect(back.events![1]).toMatchObject({ label: "Køkken", pay: "konto", year: 2031 });
    expect(last(simulate(back)).wealthWithPension).toBeCloseTo(last(simulate(p)).wealthWithPension, 0);
    expect(sanitize({ events: [{ amount: -5, year: 1990, pay: "x" } as never] }).events![0]).toMatchObject({ amount: 0, year: 2027, pay: "aktier" });
  });

  it("dyrere hus trækker mere fra Nordnet efter flytningen", () => {
    expect(nordnetCutFor(6_500_000)).toBe(1_300);
    expect(nordnetCutFor(7_500_000)).toBeGreaterThan(2_500);
    expect(nordnetCutFor(4_000_000)).toBe(0);
  });
});

describe("lejlighedens værdi", () => {
  it("formuen i dag følger den pris, lejligheden sættes til", () => {
    const base = simulate(BASE);
    const lower = simulate({ ...BASE, apartmentSalePrice: 6_500_000 });
    expect(base.rows[0].wealthWithPension - lower.rows[0].wealthWithPension).toBeCloseTo(500_000, 0);
    expect(base.rows[0].equity - lower.rows[0].equity).toBeCloseTo(500_000, 0);
    expect(lower.rows[0].emil.wealth).toBeCloseTo(base.rows[0].emil.wealth - 250_000, 0);
    const g = growthBreakdown(lower);
    expect(Math.abs(g.sum - g.total)).toBeLessThan(1);
  });
});
