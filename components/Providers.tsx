"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { ScenarioProvider } from "@/lib/scenario";

/** Blød scroll på computere med mus. Mobil og "mindre bevægelse" bruger almindelig scroll. */
function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let stop = false;
    let destroy = () => {};
    import("lenis").then(({ default: Lenis }) => {
      if (stop) return;
      const lenis = new Lenis({ lerp: 0.12 });
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    });
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      destroy();
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll />
      <ScenarioProvider>{children}</ScenarioProvider>
    </MotionConfig>
  );
}
