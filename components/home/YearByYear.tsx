"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX } from "d3-shape";
import { type MotionValue, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChapterHead } from "@/components/ui/Chapter";
import { Range } from "@/components/ui/Range";
import { Segmented } from "@/components/ui/Segmented";
import { Ticker } from "@/components/ui/Ticker";
import { CATEGORIES, type View, parts, totalOf } from "@/lib/base";
import type { YearRow } from "@/lib/engine";
import { kr } from "@/lib/format";
import { useMeasure, usePinned } from "@/lib/hooks";
import { useScenarioCalm } from "@/lib/scenario";

const VIEWS = [
  { value: "os", label: "Os" },
  { value: "emil", label: "Emil" },
  { value: "frederikke", label: "Frederikke" },
] as const;

const N = 9;

function AreaChart({
  rows, view, width, height, clip, cursor, small, onPick,
}: {
  rows: YearRow[]; view: View; width: number; height: number; clip: MotionValue<number>; cursor: MotionValue<number>; small: boolean; onPick: (i: number) => void;
}) {
  const pl = small ? 30 : 46;
  const pr = 10;
  const pt = 8;
  const pb = 24;
  const { paths, x, y, ticks } = useMemo(() => {
    const series = rows.map((r) => parts(r, view).map((v) => Math.max(v, 0)));
    const top = Math.max(...series.map((s) => s.reduce((a, b) => a + b, 0)));
    const step = top > 6e6 ? 2e6 : 1e6;
    const max = Math.ceil(top / step) * step;
    const x = scaleLinear().domain([0, N]).range([pl, width - pr]);
    const y = scaleLinear().domain([0, max]).range([height - pb, pt]);
    const gen = area<{ i: number; y0: number; y1: number }>()
      .x((d) => x(d.i))
      .y0((d) => y(d.y0))
      .y1((d) => y(d.y1))
      .curve(curveMonotoneX);
    const paths = CATEGORIES.map((c, ci) =>
      gen(
        series.map((s, i) => {
          const y0 = s.slice(0, ci).reduce((a, b) => a + b, 0);
          return { i, y0, y1: y0 + s[ci] };
        }),
      ) ?? "",
    );
    const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
    return { paths, x, y, ticks };
  }, [rows, view, width, height, pl]);

  const clipW = useTransform(clip, (v) => pl + v * (width - pl - pr) + 2);
  const cx = useTransform(cursor, (v) => x(v * N));

  return (
    <svg width={width} height={height} role="img" aria-label="Formuens udvikling år for år, delt på friværdi, aktier, konti og pension">
      <defs>
        <clipPath id="yby-clip">
          <motion.rect x={0} y={0} height={height} width={clipW} />
        </clipPath>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={width - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={pl - 6} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
            {t / 1e6}
          </text>
        </g>
      ))}
      <text x={pl - 6} y={pt + 2} textAnchor="end" fontSize={9} fill="var(--muted)" dy={-2}>
        {""}
      </text>
      <g clipPath="url(#yby-clip)">
        {paths.map((d, i) => (
          <motion.path
            key={CATEGORIES[i].key}
            initial={false}
            animate={{ d }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            fill={CATEGORIES[i].color}
            fillOpacity={0.88}
          />
        ))}
      </g>
      <motion.line x1={cx} x2={cx} y1={pt} y2={height - pb} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 4" />
      {rows.map((r, i) => (
        <g key={r.year}>
          {(!small || i % 3 === 0) && (
            <text x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === N ? "end" : "middle"} fontSize={12} fill="var(--muted)">
              {small ? `’${String(r.year).slice(2)}` : r.year}
            </text>
          )}
          <rect
            x={x(i) - (width - pl - pr) / N / 2}
            y={0}
            width={(width - pl - pr) / N}
            height={height}
            fill="transparent"
            onClick={() => onPick(i)}
          />
        </g>
      ))}
    </svg>
  );
}

export function YearByYear() {
  const pinned = usePinned(600);
  const { sim, draft } = useScenarioCalm();
  const rows = sim.rows;
  const moveYear = 2026 + draft.saleMonth / 12;
  const outer = useRef<HTMLDivElement>(null);
  const [chartRef, width] = useMeasure<HTMLDivElement>();
  const [view, setView] = useState<View>("os");
  const [idx, setIdx] = useState(N);
  const small = width > 0 && width < 560;
  const height = small ? 210 : 400;

  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const reveal = useTransform(scrollYProgress, [0.05, 0.92], [0, 1], { clamp: true });
  const one = useMotionValue(1);
  const manual = useMotionValue(1);

  useMotionValueEvent(reveal, "change", (v) => {
    if (pinned) setIdx(Math.round(v * N));
  });
  useEffect(() => {
    if (pinned) setIdx(Math.round(reveal.get() * N));
    else {
      setIdx(N);
      manual.set(1);
    }
  }, [pinned, reveal, manual]);

  const pick = (i: number) => {
    if (pinned) return;
    setIdx(i);
    manual.set(i / N);
  };

  const row = rows[idx];
  const p = parts(row, view);
  const who = view === "os" ? "Vores" : view === "emil" ? "Emils" : "Frederikkes";

  return (
    <section id="aar-for-aar" aria-labelledby="aar-for-aar-title" className="scroll-mt-24">
      <div ref={outer} className="relative" style={pinned ? { height: "330vh" } : undefined}>
        <div
          className={
            pinned
              ? "sticky top-[calc(var(--top-nav)+var(--whatif-h))] flex h-[calc(100svh-var(--top-nav)-var(--whatif-h)-var(--bottom-nav))] flex-col justify-center py-3"
              : "py-14 sm:py-24"
          }
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <ChapterHead
              id="aar-for-aar"
              no="02"
              kicker="2026 til 2035"
              title="År for år"
              intro={pinned ? undefined : "Hver oktober frem til 2035. Tryk på et år i grafen."}
              compact
            />
            <Segmented options={VIEWS} value={view} onChange={setView} label="Vis formuen for" size="sm" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 lg:grid-cols-[1.7fr_1fr] lg:gap-4">
            <div className="card min-w-0 p-3 sm:p-6">
              <div ref={chartRef} style={{ height }}>
                {width > 0 && (
                  <AreaChart
                    key={`${width}-${height}`}
                    rows={rows}
                    view={view}
                    width={width}
                    height={height}
                    clip={pinned ? reveal : one}
                    cursor={pinned ? reveal : manual}
                    small={small}
                    onPick={pick}
                  />
                )}
              </div>
            </div>

            <div className="card flex flex-col justify-between p-4 sm:p-6">
              <div className="flex items-end justify-between gap-3 lg:block">
                <div>
                  <p className="eyebrow">
                    {who} formue · oktober {row.year}
                    {row.year === moveYear && <span style={{ color: "var(--accent-text)" }}> · hus</span>}
                  </p>
                  <p className="mt-1 text-[clamp(1.7rem,6vw,3rem)] leading-none" style={{ color: "var(--accent-text)" }}>
                    <Ticker value={totalOf(row, view, true)} />
                  </p>
                </div>
                <p className="text-right text-xs text-muted sm:text-sm lg:mt-2 lg:text-left">
                  uden pension
                  <br className="lg:hidden" /> <Ticker value={totalOf(row, view, false)} className="text-ink" />
                </p>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-x-4 text-sm min-[360px]:grid-cols-2 lg:mt-6 lg:grid-cols-1">
                {CATEGORIES.map((c, i) => (
                  <li key={c.key} className="flex items-center justify-between gap-2 border-t border-line py-1.5 lg:py-2.5">
                    <span className="flex items-center gap-2 text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <Ticker value={p[i]} kind={small ? "mioShort" : "kr"} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {pinned ? (
            <p className="mt-3 text-center text-xs text-muted" aria-hidden>
              Scroll for at gå gennem årene
            </p>
          ) : (
            <div className="mt-5 max-w-xl">
              <Range label="Vælg år" value={row.year} min={rows[0].year} max={rows[N].year} step={1} onChange={(v) => pick(v - rows[0].year)} display={String(row.year)} />
            </div>
          )}
        </div>
      </div>

      <details className="card group mt-4 overflow-hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-semibold sm:px-6">
          Se alle tal år for år
          <span aria-hidden className="text-muted transition-transform group-open:rotate-45">＋</span>
        </summary>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-right text-[13px] sm:text-base">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-3 text-left font-semibold sm:px-6">År</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Emil</th>
                <th className="hidden px-3 py-3 font-semibold md:table-cell">Frederikke</th>
                <th className="px-3 py-3 font-semibold">Uden pension</th>
                <th className="hidden px-3 py-3 font-semibold lg:table-cell">Pension</th>
                <th className="px-3 py-3 font-semibold sm:px-6">Med pension</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-b border-line last:border-0" style={r.year === moveYear ? { background: "color-mix(in srgb, var(--accent) 10%, transparent)" } : undefined}>
                  <td className="px-3 py-3 text-left font-semibold sm:px-6">{r.year}</td>
                  <td className="num hidden px-3 py-3 font-medium md:table-cell">{kr(r.emil.wealth)}</td>
                  <td className="num hidden px-3 py-3 font-medium md:table-cell">{kr(r.frederikke.wealth)}</td>
                  <td className="num px-3 py-3">{kr(r.wealth)}</td>
                  <td className="num hidden px-3 py-3 font-medium lg:table-cell" style={{ color: "var(--sky)" }}>{kr(r.pension)}</td>
                  <td className="num px-3 py-3 sm:px-6" style={{ color: "var(--mint)" }}>{kr(r.wealthWithPension)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
