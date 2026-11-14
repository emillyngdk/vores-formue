"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

export const YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);

/**
 * Vælg et år fra 2026 til 2035.
 * På telefon er det en række, man kan svippe i, med store trykflader, og det valgte år ruller ind på midten.
 * På større skærme står alle ti år side om side.
 */
export function YearPicker({ year, setYear, id, label = "Vælg år" }: { year: number; setYear: (y: number) => void; id: string; label?: string }) {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = strip.current;
    const chip = row?.querySelector<HTMLElement>(`[data-year="${year}"]`);
    if (!row || !chip || row.offsetParent === null) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [year]);

  const button = (y: number, mobile: boolean) => {
    const on = y === year;
    return (
      <button
        key={y}
        type="button"
        role="radio"
        aria-checked={on}
        data-year={mobile ? y : undefined}
        onClick={() => setYear(y)}
        className={
          mobile
            ? `relative h-11 min-w-[60px] shrink-0 rounded-full border text-sm font-semibold transition-colors ${on ? "border-transparent text-on-accent" : "border-line bg-surface text-muted"}`
            : `relative min-h-11 rounded-xl text-sm font-semibold transition-colors ${on ? "text-on-accent" : "text-muted hover:text-ink"}`
        }
      >
        {on && (
          <motion.span
            layoutId={`${id}-${mobile ? "m" : "d"}`}
            className={`absolute inset-0 ${mobile ? "rounded-full" : "rounded-xl"}`}
            style={{ background: "var(--accent)" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <span className="num relative">{y}</span>
      </button>
    );
  };

  return (
    <>
      <div ref={strip} className="whatif-scroll -mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:hidden" role="radiogroup" aria-label={label}>
        {YEARS.map((y) => button(y, true))}
      </div>
      <div className="hidden grid-cols-10 rounded-2xl border border-line bg-surface p-1 sm:grid" role="radiogroup" aria-label={label}>
        {YEARS.map((y) => button(y, false))}
      </div>
    </>
  );
}
