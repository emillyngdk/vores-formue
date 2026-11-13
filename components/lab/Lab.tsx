"use client";

import { useEffect, useState } from "react";
import { readScenarioQuery, writeScenarioQuery } from "@/lib/route-state";
import { useScenario } from "@/lib/scenario";
import { decodeScenario, encodeScenario } from "@/lib/scenario-url";
import { Compare } from "./Compare";
import { Variables } from "./Variables";

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function Lab() {
  const sc = useScenario();
  const [year, setYear] = useState(2035);
  const [withPension, setWithPension] = useState(true);
  const [ready, setReady] = useState(false);

  // Et scenarie kan ligge i adressen, fx når det åbnes fra Spørg Claude
  useEffect(() => {
    const q = readScenarioQuery();
    if (q) sc.setDraft(decodeScenario(q));
    setReady(true);
    // Kommer man fra "Alle variabler" på forsiden, hopper siden derned
    try {
      if (sessionStorage.getItem("vf-lab-focus") === "variabler") {
        sessionStorage.removeItem("vf-lab-focus");
        window.setTimeout(() => jump("variabler"), 120);
      }
    } catch {
      /* ingen lagring, så bliver man øverst */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (ready) writeScenarioQuery(sc.changed ? encodeScenario(sc.draft) : "");
  }, [sc.draft, sc.changed, ready]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Scenarie-lab</p>
      <h1 className="display mt-3 text-[clamp(2.2rem,8vw,5rem)]">Hvad nu hvis</h1>
      <p className="mt-3 max-w-2xl text-muted sm:text-lg">Sammenlign scenarierne år for år, og ret alle variabler. Det, du ændrer her, følger med over på forsiden.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => jump("sammenlign")} className="chip">
          Sammenlign scenarier
        </button>
        <button type="button" onClick={() => jump("variabler")} className="chip">
          Alle variabler
        </button>
      </div>

      <div className="mt-10">
        <Compare year={year} setYear={setYear} withPension={withPension} setWithPension={setWithPension} />
        <Variables year={year} withPension={withPension} />
      </div>
    </div>
  );
}
