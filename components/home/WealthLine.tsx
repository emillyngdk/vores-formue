"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { eventMonth } from "@/lib/engine";
import { kr, signedKr } from "@/lib/format";
import { useMeasure, usePrefersReducedMotion } from "@/lib/hooks";
import { useScenario } from "@/lib/scenario";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Formuen fra i dag til 2035 som én linje. Planen ligger bagved som stiplet linje, når noget er ændret. */
export function WealthLine() {
  const { sim, planSim, changed, draft } = useScenario();
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const hide = useRef(0);
  useEffect(() => () => window.clearTimeout(hide.current), []);
  const release = (type: string) => {
    if (type === "mouse") return;
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setHover(null), 2200);
  };
  const small = width > 0 && width < 560;
  const height = small ? 200 : 340;
  const pl = 6;
  const pr = 14;
  const pt = 34;
  const pb = 24;

  const rows = sim.rows;
  const n = rows.length - 1;
  const values = rows.map((r) => r.wealthWithPension);
  const planValues = planSim.rows.map((r) => r.wealthWithPension);
  const top = Math.max(...values, ...planValues);
  const step = top > 7e6 ? 4e6 : 2e6;
  const max = Math.max(Math.ceil((top * 1.05) / 1e6) * 1e6, 2e6);
  const x = scaleLinear().domain([0, n]).range([pl, Math.max(width - pr, pl + 1)]);
  const y = scaleLinear().domain([0, max]).range([height - pb, pt]);
  const l = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX);
  const a = area<number>().x((_, i) => x(i)).y0(y(0)).y1((d) => y(d)).curve(curveMonotoneX);
  const morph = { duration: 0.4, ease: EASE };

  // Værdien et sted mellem to oktober-statusser
  const at = (pos: number) => {
    const i = Math.min(Math.max(Math.floor(pos), 0), n - 1);
    return values[i] + (values[i + 1] - values[i]) * (pos - i);
  };
  const movePos = draft.saleMonth / 12;
  const marks = [
    { key: "move", pos: movePos, label: "Hus" },
    ...(draft.events ?? []).filter((e) => e.on && e.amount > 0).map((e) => ({ key: e.id, pos: eventMonth(e.year) / 12, label: e.label || "Køb" })),
  ].sort((p, q) => p.pos - q.pos);

  const pick = (clientX: number, el: Element) => {
    window.clearTimeout(hide.current);
    const box = el.getBoundingClientRect();
    setHover(Math.min(n, Math.max(0, Math.round(x.invert(clientX - box.left)))));
  };
  const h = hover;

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Formuen med pension fra ${kr(values[0])} i 2026 til ${kr(values[n])} i 2035`}
            style={{ touchAction: "pan-y", display: "block" }}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
            onPointerLeave={(e) => (e.pointerType === "mouse" ? setHover(null) : release(e.pointerType))}
            onPointerUp={(e) => release(e.pointerType)}
            onPointerCancel={(e) => release(e.pointerType)}
          >
            <defs>
              <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.38" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
              <clipPath id="hero-reveal">
                <motion.rect x={0} y={0} height={height} initial={{ width: 0 }} animate={{ width: width + 20 }} transition={reduced ? { duration: 0 } : { duration: 1.5, ease: [0.65, 0, 0.35, 1], delay: 0.15 }} />
              </clipPath>
            </defs>

            {Array.from({ length: Math.floor(max / step) }, (_, i) => (i + 1) * step).map((v) => (
              <g key={v}>
                <line x1={pl} x2={width - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={pl} y={y(v) - 5} fontSize={12} fill="var(--muted)">
                  {v / 1e6} mio.
                </text>
              </g>
            ))}
            <line x1={pl} x2={width - pr} y1={y(0)} y2={y(0)} stroke="var(--line)" />

            <g clipPath="url(#hero-reveal)">
              <motion.path key={`a-${width}`} initial={false} animate={{ d: a(values) ?? "" }} transition={morph} fill="url(#hero-fill)" />
              {changed && <path d={l(planValues) ?? ""} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="4 6" strokeLinecap="round" />}
              <motion.path key={`l-${width}`} initial={false} animate={{ d: l(values) ?? "" }} transition={morph} fill="none" stroke="var(--accent)" strokeWidth={small ? 3 : 4} strokeLinecap="round" />

              {marks.map((m, i) => {
                const cx = x(m.pos);
                const cy = y(at(m.pos));
                const up = 16 + (i % 2) * 13;
                return (
                  <g key={m.key}>
                    <line x1={cx} x2={cx} y1={cy - 7} y2={cy - up + 3} stroke="var(--ink)" strokeOpacity={0.5} strokeDasharray="2 3" />
                    <circle cx={cx} cy={cy} r={4.5} fill="var(--bg)" stroke="var(--ink)" strokeWidth={2} />
                    <text x={cx} y={cy - up - 2} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)" stroke="var(--bg)" strokeWidth={4} paintOrder="stroke">
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </g>

            <circle cx={x(0)} cy={y(values[0])} r={5} fill="var(--ink)" />
            <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={reduced ? { duration: 0 } : { delay: 1.45, duration: 0.45, ease: EASE }} style={{ transformOrigin: `${x(n)}px ${y(values[n])}px` }}>
              <motion.circle className="hero-pulse" initial={false} animate={{ cx: x(n), cy: y(values[n]) }} transition={morph} r={11} fill="var(--accent)" fillOpacity={0.25} />
              <motion.circle initial={false} animate={{ cx: x(n), cy: y(values[n]) }} transition={morph} r={6} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
            </motion.g>

            {h !== null && (
              <g pointerEvents="none">
                <line x1={x(h)} x2={x(h)} y1={pt - 6} y2={y(0)} stroke="var(--ink)" strokeOpacity={0.45} />
                <circle cx={x(h)} cy={y(values[h])} r={6} fill="var(--ink)" stroke="var(--bg)" strokeWidth={2} />
              </g>
            )}

            {rows.map((r, i) =>
              !small || i % 3 === 0 ? (
                <text key={r.year} x={x(i)} y={height - 5} textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} fontSize={12} fill="var(--muted)">
                  {r.year}
                </text>
              ) : null,
            )}
          </svg>

          {h !== null && (
            <div
              className="pointer-events-none absolute top-0 whitespace-nowrap rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold"
              style={{ left: Math.min(Math.max(x(h), 86), width - 86), transform: "translateX(-50%)", boxShadow: "var(--shadow)" }}
            >
              {rows[h].year} · <span className="num">{kr(values[h])}</span>
              {changed && Math.abs(values[h] - planValues[h]) >= 500 && (
                <span className="num" style={{ color: values[h] > planValues[h] ? "var(--mint)" : "var(--coral)" }}>
                  {" "}
                  {signedKr(values[h] - planValues[h])}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
