"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const set = document.documentElement.dataset.theme as Theme | undefined;
    if (set) setTheme(set);
    else setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("vf-theme", next);
    } catch {
      /* privat vindue: temaet gælder bare til siden lukkes */
    }
    setTheme(next);
    window.dispatchEvent(new Event("vf-theme"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Skift til lys tilstand" : "Skift til mørk tilstand"}
      className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold"
    >
      <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
      {theme === "dark" ? "Lys" : "Mørk"}
    </button>
  );
}
