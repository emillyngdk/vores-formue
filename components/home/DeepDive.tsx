"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChapterHead } from "@/components/ui/Chapter";
import { Segmented } from "@/components/ui/Segmented";
import { Pension } from "./Pension";
import { Prioritetslaan } from "./Prioritetslaan";
import { Stocks } from "./Stocks";

const TABS = [
  { value: "aktier", label: "Aktier" },
  { value: "pension", label: "Pension" },
  { value: "laan", label: "Prioritetslån" },
] as const;
type Tab = (typeof TABS)[number]["value"];

/** De tre dele, man kan dykke ned i. Én ad gangen, så siden ikke bliver lang. */
export function DeepDive() {
  const [tab, setTab] = useState<Tab>("aktier");
  return (
    <section id="dyk-ned" aria-labelledby="dyk-ned-title" className="scroll-mt-24 py-14 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <ChapterHead id="dyk-ned" no="05" kicker="Aktier, pension og lån" title="Dyk ned" />
        <Segmented options={TABS} value={tab} onChange={setTab} label="Vælg emne" />
      </div>
      <div className="mt-6 sm:mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {tab === "aktier" ? <Stocks /> : tab === "pension" ? <Pension /> : <Prioritetslaan />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
