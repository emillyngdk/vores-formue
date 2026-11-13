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
    const next = Math.min(max, Math.max(min, +(Math.round((latest.current + dir * step) / step) * step).toFixed(6)));
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
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
