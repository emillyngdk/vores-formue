import { describe, expect, it } from "vitest";
import { BASE, simulate } from "@/lib/engine";
import { blocks } from "./PersonView";

describe("opgørelsen pr. person", () => {
  const scenarios = [BASE, { ...BASE, apartmentValue: 6_500_000, saleMonth: 36, askShare: 0.5, downPaymentPct: 0.5 }];
  for (const [n, p] of scenarios.entries()) {
    const r = simulate(p);
    for (const row of r.rows) {
      for (const who of ["emil", "frederikke"] as const) {
        it(`scenarie ${n}, ${who} ${row.year}: posterne giver motorens formue`, () => {
          const b = blocks(row, who);
          for (const blk of b) {
            const sum = blk.lines.reduce((a, l) => a + l.value, 0);
            expect(Math.abs(sum - blk.total.value)).toBeLessThan(2);
          }
          const total = b.reduce((a, blk) => a + blk.total.value, 0);
          expect(Math.abs(total - row[who].wealth)).toBeLessThan(1);
        });
      }
    }
  }
});
