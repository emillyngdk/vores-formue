import { BASE, growthBreakdown, simulate, type YearRow } from "@/lib/engine";

/** Basis-scenariet, regnet én gang og delt af alle sektioner */
export const base = simulate(BASE);
export const baseRows = base.rows;
export const baseGrowth = growthBreakdown(base);

export type View = "os" | "emil" | "frederikke";

export const CATEGORIES = [
  { key: "equity", label: "Friværdi", color: "var(--home)" },
  { key: "stocks", label: "Aktier", color: "var(--blue)" },
  { key: "accounts", label: "Konti", color: "var(--cash)" },
  { key: "pension", label: "Pension", color: "var(--caramel)" },
] as const;

/** De fire dele af formuen for et år, samlet eller for én person */
export function parts(r: YearRow, view: View = "os"): [number, number, number, number] {
  if (view === "os") return [r.equity, r.stocksNet, r.accounts, r.pension];
  const p = r[view];
  return [p.equityShare, p.stocksNet, p.kontoShare + p.cash - p.suLoan, p.pension];
}

export const totalOf = (r: YearRow, view: View, withPension: boolean) => {
  const [a, b, c, d] = parts(r, view);
  return a + b + c + (withPension ? d : 0);
};
