"use client";

import { motion } from "motion/react";

export const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);

/** Ti år på én række. På telefon står der ’26, på større skærme 2026. */
export function YearPicker({ year, setYear, id, label = "Vælg år" }: { year: number; setYear: (y: number) => void; id: string; label?: string }) {
  return (
    <div className="grid grid-cols-10 rounded-2xl border border-line bg-surface p-1" role="radiogroup" aria-label={label}>
      {YEARS.map((y) => {
        const on = y === year;
        return (
          <button
            key={y}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={String(y)}
            onClick={() => setYear(y)}
            className={`relative min-h-11 rounded-xl text-xs font-semibold transition-colors sm:text-sm ${on ? "text-on-accent" : "text-muted hover:text-ink"}`}
          >
            {on && <motion.span layoutId={id} className="absolute inset-0 rounded-xl" style={{ background: "var(--accent)" }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="num relative">
              <span className="sm:hidden">’{String(y).slice(2)}</span>
              <span className="hidden sm:inline">{y}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
