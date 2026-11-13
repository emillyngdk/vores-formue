"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ARTIFACT } from "@/lib/env";
import { kr, mio, pct, signedKr } from "@/lib/format";

const FORMATS = {
  kr,
  mio: (n: number) => mio(n),
  mioShort: (n: number) => mio(n).replace(" kr.", ""),
  pct: (n: number) => pct(n),
  signedKr,
  int: (n: number) => Math.round(n).toLocaleString("da-DK"),
} as const;

/**
 * Et tal, der tæller blødt hen til sin nye værdi og lander præcist.
 * Serveren viser det færdige tal, så siden kan læses uden JavaScript og uden animation.
 */
export function Ticker({
  value,
  kind = "kr",
  className,
  style,
  countUp = false,
}: {
  value: number;
  kind?: keyof typeof FORMATS;
  className?: string;
  style?: React.CSSProperties;
  countUp?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = FORMATS[kind];
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const shown = useRef(value);
  const started = useRef(!countUp);

  // Tæl op første gang tallet kommer ind på skærmen
  useEffect(() => {
    if (!countUp || reduce || started.current) return;
    const el = ref.current;
    if (!el) return;
    const visibleNow = el.getBoundingClientRect().top < window.innerHeight;
    if (ARTIFACT && !visibleNow) {
      // I artifact-udgaven står tal uden for skærmen færdige fra start
      started.current = true;
      return;
    }
    shown.current = visibleNow ? value * 0.9 : 0;
    el.textContent = format(shown.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      shown.current = value;
      el.textContent = format(value);
      return;
    }
    if (countUp && !started.current) {
      if (!inView) return;
      started.current = true;
    }
    const controls = animate(shown.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce, kind]);

  return (
    <span ref={ref} className={`num ${className ?? ""}`} style={style}>
      {format(value)}
    </span>
  );
}
