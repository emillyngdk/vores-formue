"use client";

import { type MotionValue, motion, useMotionValue, useTransform } from "motion/react";
import { ARTIFACT } from "@/lib/env";
import { kr } from "@/lib/format";

export type Step = { label: string; value: number; kind: "total" | "delta"; color?: string };

type Row = Step & { from: number; to: number };

function buildRows(steps: Step[]): { rows: Row[]; max: number } {
  let run = 0;
  const rows = steps.map((s) => {
    if (s.kind === "total") {
      run = s.value;
      return { ...s, from: 0, to: s.value };
    }
    const from = run;
    run += s.value;
    return { ...s, from, to: run };
  });
  return { rows, max: Math.max(...rows.map((r) => Math.max(r.from, r.to)), 1) };
}

function WaterfallRow({ row, max, i, n, progress }: { row: Row; max: number; i: number; n: number; progress?: MotionValue<number> }) {
  const fallback = useMotionValue(1);
  const src = progress ?? fallback;
  const a = i / n;
  const b = (i + 0.9) / n;
  const opacity = useTransform(src, [a, b], [ARTIFACT ? 0.55 : 0.12, 1], { clamp: true });
  const scale = useTransform(src, [a, b], [0, 1], { clamp: true });
  const lo = Math.max(Math.min(row.from, row.to), 0);
  const hi = Math.max(row.from, row.to, 0);
  const neg = row.kind === "delta" && row.value < 0;
  const color = row.color ?? (row.kind === "total" ? "var(--accent)" : neg ? "var(--coral)" : "var(--mint)");
  const amount = row.kind === "total" ? kr(row.value) : `${neg ? "−" : "+"}${kr(Math.abs(row.value)).replace("−", "")}`;

  const view = progress
    ? { style: { opacity } }
    : {
        initial: ARTIFACT ? (false as const) : { opacity: 0, x: -12 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true, margin: "0px 0px -8% 0px" },
        transition: { duration: 0.45, delay: i * 0.05 },
      };
  const bar = progress
    ? { style: { scaleX: scale, originX: neg ? 1 : 0 } }
    : {
        initial: ARTIFACT ? (false as const) : { scaleX: 0 },
        whileInView: { scaleX: 1 },
        viewport: { once: true, margin: "0px 0px -8% 0px" },
        transition: { duration: 0.6, delay: i * 0.05 + 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        style: { originX: neg ? 1 : 0 },
      };

  return (
    <motion.li
      {...view}
      className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-2 sm:grid-cols-[16rem_1fr_9.5rem] ${row.kind === "total" ? "font-semibold" : ""}`}
    >
      <span className="text-sm sm:text-base">{row.label}</span>
      <span className="num order-none text-right text-sm sm:order-last sm:text-base" style={{ color: row.kind === "total" ? "var(--ink)" : color === "var(--accent)" ? "var(--accent-text)" : color }}>
        {amount}
      </span>
      <span className="relative col-span-2 block h-3 rounded-full bg-surface-2 sm:col-span-1 sm:h-4" aria-hidden>
        <motion.span
          {...bar}
          className="absolute inset-y-0 block rounded-full"
          style={{ ...bar.style, left: `${(lo / max) * 100}%`, width: `${Math.max(((hi - lo) / max) * 100, 0.6)}%`, background: color, transition: "left .4s cubic-bezier(.22,1,.36,1), width .4s cubic-bezier(.22,1,.36,1)" }}
        />
      </span>
    </motion.li>
  );
}

/** Vandret waterfall: hver række bygger videre på den forrige. Kan styres af scroll via `progress`. */
export function Waterfall({ steps, progress, label }: { steps: Step[]; progress?: MotionValue<number>; label: string }) {
  const { rows, max } = buildRows(steps);
  return (
    <ol aria-label={label} className="divide-y divide-line">
      {rows.map((r, i) => (
        <WaterfallRow key={r.label} row={r} max={max} i={i} n={rows.length} progress={progress} />
      ))}
    </ol>
  );
}
