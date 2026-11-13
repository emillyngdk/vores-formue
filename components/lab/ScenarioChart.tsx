"use client";

import { scaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";
import { useMeasure } from "@/lib/hooks";

export type Series = { id: string; color: string; values: number[]; dashed?: boolean; strong?: boolean };

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Alle scenarier som linjer. Det valgte år er en lodret streg, og et tryk i grafen vælger et andet år. */
export function ScenarioChart({ series, years, index, onIndex, height }: {
  series: Series[]; years: number[]; index: number; onIndex: (i: number) => void; height: number;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const n = years.length - 1;
  const pl = 6;
  const pr = 10;
  const pt = 24;
  const pb = 24;
  const all = series.flatMap((s) => s.values);
  const top = Math.max(...all, 1);
  const step = top > 8e6 ? 4e6 : 2e6;
  const max = Math.ceil((top * 1.05) / 1e6) * 1e6;
  const x = scaleLinear().domain([0, n]).range([pl, Math.max(width - pr, pl + 1)]);
  const y = scaleLinear().domain([0, max]).range([height - pb, pt]);
  const l = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX);
  const pick = (clientX: number, el: Element) => {
    const box = el.getBoundingClientRect();
    onIndex(Math.min(n, Math.max(0, Math.round(x.invert(clientX - box.left)))));
  };
  // Den fremhævede linje tegnes sidst, så den ligger øverst
  const ordered = [...series].sort((a, b) => Number(!!a.strong) - Number(!!b.strong));

  return (
    <div ref={ref} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Formuen år for år i hvert scenarie"
          style={{ display: "block", touchAction: "pan-y", cursor: "pointer" }}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerMove={(e) => e.buttons === 1 && pick(e.clientX, e.currentTarget)}
        >
          {Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step).map((v) => (
            <g key={v}>
              <line x1={pl} x2={width - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
              <text x={pl} y={y(v) - 5} fontSize={12} fill="var(--muted)">
                {v / 1e6} mio.
              </text>
            </g>
          ))}
          <line x1={pl} x2={width - pr} y1={y(0)} y2={y(0)} stroke="var(--line)" />

          <motion.line initial={false} animate={{ x1: x(index), x2: x(index) }} transition={{ duration: 0.35, ease: EASE }} y1={pt} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.35} strokeDasharray="3 4" />

          {ordered.map((s) => (
            <motion.path
              key={`${s.id}-${width}`}
              initial={false}
              animate={{ d: l(s.values) ?? "" }}
              transition={{ duration: 0.4, ease: EASE }}
              fill="none"
              stroke={s.color}
              strokeWidth={s.strong ? 3.5 : 2}
              strokeOpacity={s.strong ? 1 : 0.75}
              strokeDasharray={s.dashed ? "4 6" : undefined}
              strokeLinecap="round"
            />
          ))}
          {ordered.map((s) => (
            <motion.circle
              key={`d-${s.id}`}
              initial={false}
              animate={{ cx: x(index), cy: y(s.values[index]) }}
              transition={{ duration: 0.35, ease: EASE }}
              r={s.strong ? 6 : 4.5}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}

          {years.map((yr, i) =>
            width > 520 || i % 3 === 0 ? (
              <text key={yr} x={x(i)} y={height - 5} textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} fontSize={12} fill={i === index ? "var(--ink)" : "var(--muted)"} fontWeight={i === index ? 700 : 400}>
                {yr}
              </text>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}
