/** Lille kurve til skuffen: scenariet som fuld linje, planen som stiplet */
export function Spark({ values, plan, className }: { values: number[]; plan?: number[]; className?: string }) {
  const all = [...values, ...(plan ?? [])];
  const lo = Math.min(...all);
  const hi = Math.max(...all, lo + 1);
  const n = values.length - 1;
  const path = (xs: number[]) => xs.map((v, i) => `${i ? "L" : "M"}${((i / n) * 100).toFixed(2)},${(34 - ((v - lo) / (hi - lo)) * 30).toFixed(2)}`).join("");
  return (
    <svg viewBox="0 0 100 38" preserveAspectRatio="none" className={className} aria-hidden>
      {plan && <path d={path(plan)} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      <path d={path(values)} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: "d .3s ease" }} />
    </svg>
  );
}
