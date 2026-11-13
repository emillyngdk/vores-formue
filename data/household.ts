/**
 * Eneste sandhedskilde for husstandens tal.
 * Status pr. oktober 2026. Alle beløb i DKK, nominelt.
 * Ingen CPR-numre, kontonumre eller adresser må ligge her.
 */

export type PersonId = "emil" | "frederikke";

export const people = {
  emil: {
    name: "Emil",
    ageOct2026: 34,
    grossMonthly: 52_000,
    netMonthly: 32_752,
    taxRate: 0.37,
    pensionPct: { own: 0.06, employer: 0.08 },
    pensionMonthly: 7_313,
    mayExtras: { ferietillaeg: 4_070, stBededag: 1_871 },
  },
  frederikke: {
    name: "Frederikke",
    ageOct2026: 30,
    grossMonthly: 57_256,
    grossMonthlyFromNov2026: 60_119,
    netMonthly: 35_361,
    taxRate: 0.38,
    pensionPct: { own: 0.04, employer: 0.11 },
    pensionMonthly: 9_018,
    mayExtras: { ferietillaeg: 2_471, stBededag: 276 },
  },
} as const;

export const child = {
  name: "Axel",
  boernepengeMonthly: 1_790,
  boernepengeQuarterly: 5_370,
  vuggestueMonthly: 4_897,
} as const;

/** Status pr. oktober 2026 */
export const snapshot = {
  emil: { nordnetValue: 353_983, nordnetBasis: 352_000, cash: 33_673, pension: 79_129 },
  frederikke: {
    nordnetValue: 81_385,
    nordnetBasis: 81_000,
    cash: 75_000,
    pension: 335_077,
    suLoan: 82_300,
  },
  shared: {
    apartmentValue: 7_000_000,
    ownershipSplit: 0.5,
    realkredit: 3_873_000,
    realkreditQuarterly: 33_161,
    prioritetslaan: 540_000,
    prioritetsKonto: 205_707,
    energilaan: 82_000,
  },
} as const;

export const loans = {
  prioritetslaan: {
    principal: 540_000,
    rate: 0.0477,
    cita3: 0.0217,
    spread: 0.026,
    kontoRate: 0.0407,
    kontoSpreadPp: 0.7,
    boligrabat: 0.0025,
    effectiveRateWithKonto: 0.0297,
    interestOnlyUntil: 2036,
    oldBoligLaanRate: 0.0375,
    extraCostVsOldBeforeTax: 220,
    extraCostVsOldAfterTax: 165,
    costPer10kWithdrawn: 34,
    freedMonthly: 4_000,
    minKontoAtQuarterEnd: 50_000,
  },
  energilaan: { rate: 0.015, monthly: 907 },
  suLoan: { rate: 0.0285, monthly: 1_257 },
  realkredit: { interestOnly: true },
} as const;

/** Månedlig pengestrøm efter omlægningen i oktober 2026 */
export const monthlyFlow = {
  perPerson: {
    toPrioritetsKonto: 11_000,
    savingsToPrioritetsKonto: 2_000,
    axelKonto: 650,
  },
  nordnet: { emil: 6_000, frederikke: 7_000 },
  prioritetsKontoIn: 26_000,
  prioritetsKontoPays: [
    { label: "Totalkredit", monthly: 11_054 },
    { label: "Prioritetslån", monthly: null },
    { label: "Energilån", monthly: 907 },
    { label: "Ejerforening", monthly: 3_000 },
    { label: "Vuggestue", monthly: 4_897 },
    { label: "El", monthly: 394 },
    { label: "Indboforsikring", monthly: 359 },
    { label: "Bilforsikring", monthly: 450 },
    { label: "Gebyrer", monthly: 200 },
    { label: "Madkonto", monthly: 1_000 },
  ],
  personalFixed: {
    emil: [
      { label: "A-kasse", monthly: 578 },
      { label: "Forsikringer", monthly: 645 },
      { label: "Billån (halvdel)", monthly: 1_829 },
      { label: "Rengøring", monthly: 2_000 },
      { label: "Opladning af bil", monthly: 600 },
    ],
    frederikke: [
      { label: "A-kasse", monthly: 561 },
      { label: "Forsikring", monthly: 113 },
      { label: "Billån (halvdel)", monthly: 1_829 },
      { label: "Måltidskasser", monthly: 1_647 },
      { label: "SU-lån", monthly: 1_257 },
      { label: "Fagforening", monthly: 350 },
      { label: "TV2 Play", monthly: 239 },
      { label: "Mobil", monthly: 120 },
    ],
  },
  wealthBuildingMonthly: { nordnet: 13_000, pension: 16_331, afdrag: 1_900, total: 31_200 },
} as const;

/** Planen for bolighandlen i oktober 2028 */
export const plan = {
  saleMonth: 24, // oktober 2028
  apartmentSalePrice: 7_000_000,
  salaer: 75_000,
  housePrice: 6_500_000,
  downPaymentPct: 0.2,
  purchaseCosts: 57_250,
  movingCosts: 55_000,
  newRealkredit: 5_200_000,
  newRealkreditRate: 0.0377,
  newHousingCostMonthly: 16_300,
  extraHousingCostMonthly: 2_700,
  nordnetCutAfterMove: 1_300,
  cashPerPersonAfterSale: 50_000,
  prioritetsKontoTopUpMonth: 3,
  prioritetsKontoTopUp: 6_700,
  suPaidOff: "oktober 2032",
} as const;

export const taxRules2026 = {
  shareIncome: { low: 0.27, high: 0.42, threshold: 79_400 },
  aktiesparekonto: {
    rate: 0.17,
    depositCap2026: 174_200,
    depositCap2027: 179_300,
    proposedCap: 500_000,
    proposedCapEnacted: false,
  },
  pensionShownBeforeTax: true,
  pensionTaxForPeerComparison: 0.4,
  boligskatEmilShare2026: {
    ejendomsvaerdiskat: 6_651,
    grundskyld: 2_281,
    comparisonEjendomsvaerdiskat: { year: 2024, amount: 19_751 },
    comparisonGrundskyld: { year: 2023, amount: 6_320 },
    indefrysning: false,
    boligskattelaan: 0,
    frederikkeChecked: false,
  },
} as const;

export const housingMarket = {
  source: "Nykredit boligprisprognose, opdateret 2. november 2026",
  apartmentsAarhus: { sqmPrice: 40_500, growth2026: 0.151, growth2027: 0.115 },
  housesEastJutland: { sqmPrice: 18_700, growth2026: 0.061, growth2027: 0.051 },
  note:
    "De 11,5 % sammenligner gennemsnittet for 2027 med gennemsnittet for 2026. En stor del skyldes de høje priser, der allerede er nået i løbet af 2026. Væksten ventes dæmpet i første halvdel af 2027.",
} as const;

export const peers = {
  source: "CEPOS/DST 2024-data på 2026-niveau. Pr. person, pension med 40 % skat fradraget, aktier før skat.",
  emil: {
    age: 34,
    median: 390_000,
    top25: 976_000,
    top10: 1_791_000,
    top5: 2_546_000,
    top1: 6_137_000,
    ourWealth: 1_750_000,
    placement: "lige under top 10 %",
  },
  frederikke: {
    age: 30,
    median: 212_000,
    top25: 594_000,
    top10: 1_199_000,
    top5: 1_778_000,
    top1: 4_507_000,
    ourWealth: 1_590_000,
    placement: "ca. top 6 %",
  },
  projection2031: {
    note: "Grænserne er fremskrevet med 3 % om året. Det er et skøn.",
    emil: { age: 39, wealth: 3_010_000, placement: "ca. top 11 %", median: 800_000, top25: 1_780_000, top10: 3_130_000, top5: 4_470_000 },
    frederikke: { age: 35, wealth: 2_980_000, placement: "ca. top 6 %", median: 510_000, top25: 1_260_000, top10: 2_270_000, top5: 3_210_000 },
  },
} as const;

export const openItems = [
  { id: "energilaan", title: "Flyt energilånet til PrioritetsKontoen", detail: "De 907 kr. om måneden trækkes stadig fra Budgetkontoen. Første betaling er 30. november 2026." },
  { id: "budgetkonto", title: "Hold 5–10.000 kr. på Budgetkontoen", detail: "Indtil BS-aftalernes status \"Under rettelse\" er væk i netbanken." },
  { id: "ask", title: "Fyld aktiesparekontoen op", detail: "Sælg op til loftet i det frie depot og sæt pengene ind. Der er næsten ingen gevinst endnu, så det koster meget lidt i skat. Gælder for os begge." },
  { id: "indefrysning", title: "Frederikke tjekker indefrysning på skat.dk", detail: "Emils er tjekket: ingen boligskattelån, og indefrysning er fravalgt." },
  { id: "bil", title: "Find tallene for bilen", detail: "Billånet (2 × 1.829 kr. om måneden) og Teslaens værdi er ikke med i formuen endnu. Vi mangler restgæld og bilens værdi." },
  { id: "loen", title: "Lønstigninger er ikke med i planen", detail: "De kan slås til i scenarie-lab'et, så vi kan se effekten." },
] as const;

export const meta = { dataAsOf: "oktober 2026", lastUpdated: "13. november 2026" } as const;
