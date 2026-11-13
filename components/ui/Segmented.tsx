"use client";

import { motion } from "motion/react";
import { useId } from "react";

/** Vælger mellem få muligheder. Den aktive markering glider på plads. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full rounded-full border border-line bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative rounded-full font-semibold transition-colors ${size === "sm" ? "min-h-11 whitespace-nowrap px-3 text-xs md:min-h-9" : "min-h-11 whitespace-nowrap px-4 text-sm"} ${active ? "text-on-accent" : "text-muted hover:text-ink"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--accent)" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
