import { describe, expect, it } from "vitest";
import { BASE, effectiveCut } from "@/lib/engine";
import { decodeScenario } from "@/lib/scenario-url";
import { explainTerm } from "./glossary";
import { buildSystemPrompt } from "./system";
import { TOOLS, runTool, toParams } from "./tools";

describe("assistentens værktøjer", () => {
  it("oversætter et scenarie i procenter og kroner", () => {
    const p = toParams({ aktieafkast_pct: 4, salgspris_lejlighed: 7_400_000, huspris: 6_900_000, salgsaar: 2029, su_til_nordnet: true });
    expect(p.stockReturn).toBeCloseTo(0.04);
    expect(p.apartmentValue).toBe(7_400_000);
    expect(p.housePrice).toBe(6_900_000);
    expect(p.saleMonth).toBe(36);
    expect(p.suToNordnet).toBe(true);
    expect(p.pensionReturn).toBe(BASE.pensionReturn);
  });
  it("tåler skævt input og holder værdier inden for grænserne", () => {
    expect(toParams(null)).toEqual(BASE);
    expect(toParams({ aktieafkast_pct: 500, salgsaar: 1999, huspris: "meget" }).stockReturn).toBe(0.2);
    expect(toParams({ salgsaar: 1999 }).saleMonth).toBe(12);
  });
  it("simulate uden scenarie giver basisplanen og intet kort", () => {
    const out = runTool("simulate", {});
    const r = out.result as { aar_for_aar: { aar: number; samlet_med_pension: number }[]; forskel_mod_basis: Record<string, { med_pension: number }> };
    expect(r.aar_for_aar).toHaveLength(10);
    expect(r.aar_for_aar[9].samlet_med_pension).toBe(9_657_845);
    expect(r.forskel_mod_basis["2035"].med_pension).toBe(0);
    expect(out.card).toBeUndefined();
  });
  it("simulate med scenarie giver et kort, der kan åbnes i lab", () => {
    const out = runTool("simulate", { scenarie: { aktieafkast_pct: 4 } });
    expect(out.card).toBeDefined();
    expect(out.card!.d2035).toBeLessThan(0);
    expect(decodeScenario(out.card!.query).stockReturn).toBeCloseTo(0.04);
  });
  it("compare giver forskellen mellem to scenarier", () => {
    const r = runTool("compare", { a: {}, b: { aktieafkast_pct: 10 } }).result as Record<string, { forskel_med_pension: number }>;
    expect(r["2035"].forskel_med_pension).toBeGreaterThan(500_000);
  });
  it("get_snapshot finder år og person", () => {
    const emil = runTool("get_snapshot", { aar: 2031, person: "emil" }).result as { formue_uden_pension: number };
    expect(emil.formue_uden_pension).toBe(2_533_917);
    expect(runTool("get_snapshot", { aar: 2050 }).result).toHaveProperty("fejl");
  });
  it("ordliste og ukendt værktøj", () => {
    expect(explainTerm("Lagerbeskatning")).toHaveProperty("forklaring");
    expect(explainTerm("kryptovaluta")).toHaveProperty("fejl");
    expect(runTool("slet_alt", {}).result).toHaveProperty("fejl");
  });
  it("værktøjernes skemaer har navne og objekt-input", () => {
    expect(TOOLS.map((t) => t.name)).toEqual(["simulate", "compare", "get_snapshot", "explain_term"]);
    for (const t of TOOLS) expect(t.input_schema.type).toBe("object");
  });
  it("systemprompten indeholder tallene, men ingen følsomme oplysninger", () => {
    const s = buildSystemPrompt();
    expect(s).toContain("3.511.015 kr.");
    expect(s).toContain("9.657.845 kr.");
    expect(s).not.toMatch(/\d{6}-\d{4}/); // CPR
    expect(s).not.toMatch(/@/); // e-mail
    expect(s).not.toMatch(/Hans Broges/i); // adresse
  });
});

describe("engangskøb fra assistenten", () => {
  it("regner et bilkøb og giver et kort, der kan åbnes i lab'et", () => {
    const out = runTool("simulate", { scenarie: { engangskoeb: [{ navn: "Bil", pris: 350_000, aar: 2029, betaling: "laan", loebetid_aar: 6, rente_pct: 4.5 }] } });
    const res = out.result as { engangskoeb: { ydelse_pr_maaned: number }[]; forskel_mod_basis: { "2035": { med_pension: number } } };
    expect(res.engangskoeb[0].ydelse_pr_maaned).toBeGreaterThan(5_000);
    expect(res.forskel_mod_basis["2035"].med_pension).toBeLessThan(-350_000);
    expect(out.card?.query).toContain("ev=");
  });
  it("et dyrere hus trækker mere fra Nordnet", () => {
    expect(effectiveCut(toParams({ huspris: 7_500_000 }))).toBeGreaterThan(2_500);
    expect(effectiveCut(toParams({}))).toBe(1_300);
    expect(effectiveCut(toParams({ rente_nyt_realkreditlaan_pct: 5 }))).toBeGreaterThan(1_300);
  });
});
