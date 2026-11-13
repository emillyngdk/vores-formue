import { baseRows } from "@/lib/base";
import { BASE, type ScenarioParams, type SimulationResult, nordnetCutFor, simulate } from "@/lib/engine";
import { encodeScenario, sanitize } from "@/lib/scenario-url";
import { explainTerm } from "./glossary";

/** Scenarie, som assistenten beskriver det: procenter som hele tal, beløb i kroner */
export interface ScenarioInput {
  aktieafkast_pct?: number;
  pensionsafkast_pct?: number;
  husprisvaekst_pct?: number;
  salgspris_lejlighed?: number;
  huspris?: number;
  salgsaar?: number;
  nordnet_emil?: number;
  nordnet_frederikke?: number;
  loenstigning_pct?: number;
  su_til_nordnet?: boolean;
  andel_aktiesparekonto_pct?: number;
  engangskoeb?: { navn?: string; pris?: number; aar?: number; betaling?: string; loebetid_aar?: number; rente_pct?: number }[];
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export function toParams(input: unknown): ScenarioParams {
  const s = (input && typeof input === "object" ? input : {}) as ScenarioInput;
  const pctOf = (v: unknown) => (num(v) === undefined ? undefined : (num(v) as number) / 100);
  const year = num(s.salgsaar);
  const housePrice = num(s.huspris);
  const events = Array.isArray(s.engangskoeb)
    ? s.engangskoeb.map((e, i) => ({
        id: `e${i + 1}`,
        label: typeof e?.navn === "string" ? e.navn : "Køb",
        amount: num(e?.pris) ?? 0,
        year: num(e?.aar) ?? 2027,
        pay: (e?.betaling === "konto" || e?.betaling === "laan" ? e.betaling : "aktier") as "konto" | "aktier" | "laan",
        loanYears: num(e?.loebetid_aar) ?? 7,
        loanRate: (num(e?.rente_pct) ?? 5) / 100,
        on: true,
      }))
    : undefined;
  return sanitize({
    stockReturn: pctOf(s.aktieafkast_pct),
    pensionReturn: pctOf(s.pensionsafkast_pct),
    houseGrowth: pctOf(s.husprisvaekst_pct),
    apartmentSalePrice: num(s.salgspris_lejlighed),
    housePrice,
    // Et dyrere hus koster mere i rente, og det trækkes fra Nordnet efter flytningen
    nordnetCutAfterMove: housePrice === undefined ? undefined : nordnetCutFor(housePrice),
    events,
    saleMonth: year === undefined ? undefined : (year - 2026) * 12,
    nordnetEmil: num(s.nordnet_emil),
    nordnetFrederikke: num(s.nordnet_frederikke),
    salaryGrowth: pctOf(s.loenstigning_pct),
    suToNordnet: typeof s.su_til_nordnet === "boolean" ? s.su_til_nordnet : undefined,
    askShare: pctOf(s.andel_aktiesparekonto_pct),
  });
}

const r0 = (n: number) => Math.round(n);

function table(result: SimulationResult) {
  return result.rows.map((r) => ({
    aar: r.year,
    emil_uden_pension: r0(r.emil.wealth),
    frederikke_uden_pension: r0(r.frederikke.wealth),
    samlet_uden_pension: r0(r.wealth),
    pension: r0(r.pension),
    samlet_med_pension: r0(r.wealthWithPension),
    frivaerdi: r0(r.equity),
    aktier_efter_skat: r0(r.stocksNet),
  }));
}

function describe(p: ScenarioParams) {
  return {
    aktieafkast_pct: +(p.stockReturn * 100).toFixed(2),
    pensionsafkast_pct: +(p.pensionReturn * 100).toFixed(2),
    husprisvaekst_pct: +(p.houseGrowth * 100).toFixed(2),
    salgspris_lejlighed: p.apartmentSalePrice,
    huspris: p.housePrice,
    salgsaar: 2026 + p.saleMonth / 12,
    nordnet_emil: p.nordnetEmil,
    nordnet_frederikke: p.nordnetFrederikke,
    loenstigning_pct: +(p.salaryGrowth * 100).toFixed(2),
    su_til_nordnet: p.suToNordnet,
    andel_aktiesparekonto_pct: +(p.askShare * 100).toFixed(0),
    nordnet_ned_efter_flytning_pr_person: p.nordnetCutAfterMove,
    engangskoeb: (p.events ?? []).map((e) => ({ navn: e.label, pris: e.amount, aar: e.year, betaling: e.pay, loebetid_aar: e.loanYears, rente_pct: +(e.loanRate * 100).toFixed(2) })),
  };
}

function diff(result: SimulationResult) {
  const at = (y: number) => {
    const r = result.rows.find((x) => x.year === y)!;
    const b = baseRows.find((x) => x.year === y)!;
    return { med_pension: r0(r.wealthWithPension - b.wealthWithPension), uden_pension: r0(r.wealth - b.wealth) };
  };
  return { "2031": at(2031), "2035": at(2035) };
}

/** Kort, der vises i chatten, når assistenten har regnet et scenarie */
export interface ScenarioCard {
  query: string; // til /lab?…
  y2031: number;
  y2035: number;
  d2031: number;
  d2035: number;
}

function card(p: ScenarioParams, result: SimulationResult): ScenarioCard {
  const d = diff(result);
  return {
    query: encodeScenario(p),
    y2031: r0(result.rows[5].wealthWithPension),
    y2035: r0(result.rows[9].wealthWithPension),
    d2031: d["2031"].med_pension,
    d2035: d["2035"].med_pension,
  };
}

const scenarioSchema = {
  type: "object" as const,
  description: "Kun de felter, der afviger fra basisplanen. Udeladte felter bruger basis.",
  properties: {
    aktieafkast_pct: { type: "number", description: "Aktieafkast pr. år i procent. Basis 7." },
    pensionsafkast_pct: { type: "number", description: "Pensionsafkast pr. år i procent. Basis 4." },
    husprisvaekst_pct: { type: "number", description: "Husets værdistigning pr. år i procent efter købet. Basis 3,5." },
    salgspris_lejlighed: { type: "number", description: "Lejlighedens værdi i kr. Bruges både som værdien i dag og som salgsprisen. Basis 7000000." },
    huspris: { type: "number", description: "Husets pris i kr. Basis 6500000. Udbetalingen er 20 %." },
    salgsaar: { type: "integer", description: "Året hvor lejligheden sælges og huset købes (oktober). 2027 til 2030. Basis 2028." },
    nordnet_emil: { type: "number", description: "Emils månedlige indbetaling til Nordnet i kr. Basis 6000." },
    nordnet_frederikke: { type: "number", description: "Frederikkes månedlige indbetaling til Nordnet i kr. Basis 7000." },
    loenstigning_pct: { type: "number", description: "Lønstigning pr. år i procent. Hæver pension og Nordnet-opsparing. Basis 0." },
    su_til_nordnet: { type: "boolean", description: "Om Frederikkes 1.257 kr./md går til Nordnet, når SU-lånet er betalt i 2032. Basis false." },
    andel_aktiesparekonto_pct: { type: "number", description: "Andel af månedsopsparingen på aktiesparekonto i procent, til loftet er nået. Basis 0." },
    engangskoeb: {
      type: "array",
      description: "Engangskøb, fx en bil. Regnes som en ren udgift: det købte tæller ikke med i formuen. Højst 6.",
      items: {
        type: "object",
        properties: {
          navn: { type: "string", description: "Kort navn, fx Bil." },
          pris: { type: "number", description: "Det, der skal betales, i kr." },
          aar: { type: "integer", description: "Købet sker i januar det år. 2027 til 2035." },
          betaling: { type: "string", enum: ["konto", "aktier", "laan"], description: "konto = PrioritetsKontoen først og resten fra aktier. aktier = der sælges aktier. laan = lån, hvor ydelsen går fra Nordnet-opsparingen." },
          loebetid_aar: { type: "integer", description: "Lånets løbetid i år, kun ved laan. Standard 7." },
          rente_pct: { type: "number", description: "Lånets rente i procent, kun ved laan. Standard 5, som er et gæt." },
        },
        required: ["pris", "aar"],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export const TOOLS = [
  {
    name: "simulate",
    description:
      "Regner husstandens formue år for år 2026–2035 for et scenarie. Brug den til ethvert 'hvad nu hvis'-spørgsmål og til alle tal, der ikke står i konteksten. Kald den uden scenarie for basisplanen.",
    input_schema: { type: "object" as const, properties: { scenarie: scenarioSchema }, additionalProperties: false },
  },
  {
    name: "compare",
    description: "Sammenligner to scenarier og giver forskellen i 2031 og 2035, med og uden pension.",
    input_schema: {
      type: "object" as const,
      properties: { a: scenarioSchema, b: scenarioSchema },
      required: ["a", "b"],
      additionalProperties: false,
    },
  },
  {
    name: "get_snapshot",
    description: "Henter formuen og dens dele for ét år i basisplanen, samlet eller for én person.",
    input_schema: {
      type: "object" as const,
      properties: {
        aar: { type: "integer", description: "2026 til 2035" },
        person: { type: "string", enum: ["os", "emil", "frederikke"] },
      },
      required: ["aar"],
      additionalProperties: false,
    },
  },
  {
    name: "explain_term",
    description: "Slår et fagudtryk op i den lokale ordliste, fx prioritetslån, lagerbeskatning eller friværdi.",
    input_schema: { type: "object" as const, properties: { term: { type: "string" } }, required: ["term"], additionalProperties: false },
  },
];

export interface ToolOutcome {
  result: unknown;
  card?: ScenarioCard;
}

/** Kører et værktøjskald. Alle tal kommer fra regnemotoren, aldrig fra modellen selv. */
export function runTool(name: string, input: unknown): ToolOutcome {
  const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  switch (name) {
    case "simulate": {
      const p = toParams(args.scenarie);
      const result = simulate(p);
      const isBase = encodeScenario(p) === "";
      return {
        result: {
          scenarie: describe(p),
          aar_for_aar: table(result),
          bolighandel: result.sale && {
            netto: r0(result.sale.net),
            udbetaling: r0(result.sale.downPayment),
            overskud: r0(result.sale.surplus),
            pr_person: r0(result.sale.perPerson),
            nyt_realkreditlaan: r0(result.sale.newRealkredit),
          },
          engangskoeb: result.events.map((e) => ({
            navn: e.label, aar: e.year, pris: r0(e.amount), fra_prioritetskonto: r0(e.fromKonto), fra_aktier_efter_skat: r0(e.fromStocks),
            skat_udloest: r0(e.tax), ydelse_pr_maaned: r0(e.monthly), betalt_paa_laan_til_2035: r0(e.paid), mangler: r0(e.shortfall),
          })),
          forskel_mod_basis: diff(result),
        },
        card: isBase ? undefined : card(p, result),
      };
    }
    case "compare": {
      const pa = toParams(args.a);
      const pb = toParams(args.b);
      const a = simulate(pa);
      const b = simulate(pb);
      const at = (i: number) => ({
        a_med_pension: r0(a.rows[i].wealthWithPension),
        b_med_pension: r0(b.rows[i].wealthWithPension),
        forskel_med_pension: r0(b.rows[i].wealthWithPension - a.rows[i].wealthWithPension),
        forskel_uden_pension: r0(b.rows[i].wealth - a.rows[i].wealth),
      });
      return { result: { a: describe(pa), b: describe(pb), "2031": at(5), "2035": at(9) }, card: encodeScenario(pb) === "" ? undefined : card(pb, b) };
    }
    case "get_snapshot": {
      const year = typeof args.aar === "number" ? Math.round(args.aar) : NaN;
      const row = baseRows.find((r) => r.year === year);
      if (!row) return { result: { fejl: "År skal være mellem 2026 og 2035." } };
      const person = args.person === "emil" || args.person === "frederikke" ? args.person : "os";
      if (person === "os") {
        return {
          result: {
            aar: year, bolig: row.ownsHouse ? "hus" : "lejlighed", boligvaerdi: r0(row.homeValue), gaeld_i_boligen: r0(row.debt), frivaerdi: r0(row.equity),
            prioritetskonto: r0(row.prioritetsKonto), aktier_efter_skat: r0(row.stocksNet), pension: r0(row.pension),
            samlet_uden_pension: r0(row.wealth), samlet_med_pension: r0(row.wealthWithPension),
          },
        };
      }
      const x = row[person];
      return {
        result: {
          aar: year, person, halv_frivaerdi: r0(x.equityShare), halv_prioritetskonto: r0(x.kontoShare), aktier_foer_skat: r0(x.stocksValue),
          skat_hvis_solgt: r0(x.stocksTax), aktier_efter_skat: r0(x.stocksNet), kontanter: r0(x.cash), su_laan: r0(x.suLoan), pension: r0(x.pension),
          formue_uden_pension: r0(x.wealth), formue_med_pension: r0(x.wealthWithPension),
        },
      };
    }
    case "explain_term":
      return { result: explainTerm(typeof args.term === "string" ? args.term : "") };
    default:
      return { result: { fejl: `Ukendt værktøj: ${name}` } };
  }
}

export const BASE_PARAMS = BASE;
