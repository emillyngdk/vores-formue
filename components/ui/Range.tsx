"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Skyder med navn og aktuel værdi. Bruger browserens egen range, så den virker med tastatur og touch.
 * På telefon står der en minus- og en plusknap ved værdien, så man kan ramme præcist med tommelfingeren.
 */
export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
  color = "var(--accent)",
  nudge,
  plan,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
  color?: string;
  /** Hvor meget plus og minus flytter. Standard er `step`. */
  nudge?: number;
  /** Planens værdi. Er værdien ændret, vises planens værdi og en knap tilbage til den. */
  plan?: { value: number; display: string; onReset: () => void };
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  const latest = useRef(value);
  latest.current = value;
  const change = useRef(onChange);
  change.current = onChange;
  const timers = useRef<{ wait?: number; repeat?: number }>({});

  const stop = () => {
    window.clearTimeout(timers.current.wait);
    window.clearInterval(timers.current.repeat);
  };
  useEffect(() => stop, []);

  const stepBy = (dir: number) => {
    const next = Math.min(max, Math.max(min, +(Math.round((latest.current + dir * (nudge ?? step)) / step) * step).toFixed(6)));
    if (next === latest.current) return stop();
    latest.current = next;
    change.current(next);
  };
  // Hold knappen nede for at blive ved
  const hold = (dir: number) => () => {
    stop();
    stepBy(dir);
    timers.current.wait = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => stepBy(dir), 70);
    }, 380);
  };
  const stepper = (dir: number, text: string, sign: string) => (
    <button
      type="button"
      aria-label={`${label}: ${text}`}
      disabled={dir < 0 ? value <= min : value >= max}
      onPointerDown={hold(dir)}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) stepBy(dir); // tastatur
      }}
      className="stepper h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-xl font-semibold leading-none disabled:opacity-35"
    >
      <span aria-hidden>{sign}</span>
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="min-w-0 text-sm font-semibold">
          {label}
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {stepper(-1, "mindre", "−")}
          {display && (
            <output htmlFor={id} className="num text-sm">
              {display}
            </output>
          )}
          {stepper(1, "mere", "+")}
        </div>
      </div>
      <input
        id={id}
        type="range"
        className="range mt-2"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%`, "--range-color": color } as React.CSSProperties}
      />
      {plan && Math.abs(plan.value - value) > step / 2 && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          Planen: <span className="num font-semibold text-ink">{plan.display}</span>
          <button type="button" onClick={plan.onReset} className="-my-2 min-h-11 px-1 font-semibold underline underline-offset-4" style={{ color: "var(--accent-text)" }}>
            Tilbage til planen
          </button>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
