"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";
import { useMeasure } from "@/lib/hooks";

/** Scenariet som fuld linje, basis som stiplet "spøgelseslinje" */
export function LineCompare({ scenario, baseline, years, height }: { scenario: number[]; baseline: number[]; years: number[]; height: number }) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const pl = 30;
  const pr = 8;
  const pt = 8;
  const pb = 22;
  const top = Math.max(...scenario, ...baseline);
  const step = top > 8e6 ? 4e6 : top > 4e6 ? 2e6 : 1e6;
  const max = Math.ceil((top * 1.04) / step) * step;
  const x = scaleLinear().domain([0, years.length - 1]).range([pl, Math.max(width - pr, pl + 1)]);
  const y = scaleLinear().domain([0, max]).range([height - pb, pt]);
  const l = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX);
  const a = area<number>().x((_, i) => x(i)).y0(y(0)).y1((d) => y(d)).curve(curveMonotoneX);
  const t = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
  return (
    <div ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Scenariets formue år for år sammenlignet med basis">
          <defs>
            <linearGradient id="lab-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: max / step + 1 }, (_, i) => i * step).map((v) => (
            <g key={v}>
              <line x1={pl} x2={width - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
              <text x={pl - 6} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">{v / 1e6}</text>
            </g>
          ))}
          <motion.path key={`a-${width}`} initial={false} animate={{ d: a(scenario) ?? "" }} transition={t} fill="url(#lab-fill)" />
          <path d={l(baseline) ?? ""} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 6" />
          <motion.path key={`l-${width}`} initial={false} animate={{ d: l(scenario) ?? "" }} transition={t} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
          {years.map((yr, i) =>
            i % 3 === 0 ? (
              <text key={yr} x={x(i)} y={height - 5} textAnchor={i === 0 ? "start" : i === years.length - 1 ? "end" : "middle"} fontSize={12} fill="var(--muted)">
                {yr}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}
