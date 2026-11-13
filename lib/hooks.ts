"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/** Bredden på et element, opdateret når det ændrer størrelse */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Gemmer småting på enheden. Virker også, hvis lageret er blokeret. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* brug startværdien */
    }
    setLoaded(true);
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* gælder kun til siden lukkes */
      }
    },
    [key],
  );
  // Fjerde værdi: om tallene deles med andre, der åbner siden (kun i artifact-udgaven)
  return [value, set, loaded, false as boolean] as const;
}

/** true når brugeren har bedt om mindre bevægelse */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Fastlåste scroll-sektioner bruges kun, når der er plads og bevægelse er ok */
export function usePinned(minHeight = 600) {
  const reduced = usePrefersReducedMotion();
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const on = () => setTall(window.innerHeight >= minHeight);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [minHeight]);
  return tall && !reduced;
}
