"use client";

import { useInView } from "motion/react";
import { useRef, useState } from "react";
import { Chapter } from "@/components/ui/Chapter";
import { Segmented } from "@/components/ui/Segmented";
import { peers } from "@/data/household";

type Marks = { median: number; top25: number; top10: number; top5: number; top1?: number };
const TICKS = [
  { key: "median", label: "Median", at: 0.1 },
  { key: "top25", label: "Top 25 %", at: 0.36 },
  { key: "top10", label: "Top 10 %", at: 0.62 },
  { key: "top5", label: "Top 5 %", at: 0.88 },
] as const;

/** Placering på båndet: lineært mellem to grænser */
function position(v: number, m: Marks) {
  const pts: [number, number][] = [[0, 0], [m.median, 0.1], [m.top25, 0.36], [m.top10, 0.62], [m.top5, 0.88], [m.top1 ?? m.top5 * 2.4, 1]];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][0]) {
      const [v0, p0] = pts[i - 1];
      const [v1, p1] = pts[i];
      return p0 + ((v - v0) / (v1 - v0)) * (p1 - p0);
    }
  }
  return 1;
}

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("da-DK", { maximumFractionDigits: 2 })} mio.` : `${Math.round(n / 1000)}.000`);

function Strip({ name, age, wealth, marks, placement, color }: {
  name: string; age: number; wealth: number; marks: Marks; placement: string; color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const pos = seen ? position(wealth, marks) : 0;
  return (
    <div ref={ref} className="card p-5 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-bold">
          {name} <span className="font-normal text-muted">· {age} år</span>
        </h3>
        <p className="text-sm font-semibold" style={{ color }}>{placement}</p>
      </div>
      <div className="relative mt-14 h-3 rounded-full" style={{ background: "linear-gradient(to right, var(--surface-2), color-mix(in srgb, var(--accent) 70%, var(--surface-2)))" }}>
        {TICKS.map((t) => (
          <span key={t.key} className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ left: `${t.at * 100}%`, background: "var(--muted)" }} aria-hidden />
        ))}
        <div className="absolute top-1/2" style={{ left: `${pos * 100}%`, transition: "left 1.1s cubic-bezier(.22,1,.36,1)" }}>
          <span className="absolute left-0 top-0 block h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ background: "var(--ink)", borderColor: color }} />
          <span
            className={`num absolute bottom-5 whitespace-nowrap rounded-full px-3 py-1 text-xs ${pos > 0.7 ? "right-0 translate-x-3" : "left-0 -translate-x-1/2"}`}
            style={{ background: color, color: "var(--on-fill)", opacity: seen ? 1 : 0, transition: "opacity .4s ease .7s" }}
          >
            ca. {short(wealth)} kr.
          </span>
        </div>
      </div>
      <ul className="relative mt-4 h-10 text-xs">
        {TICKS.map((t) => (
          <li key={t.key} className="absolute -translate-x-1/2 text-center leading-tight" style={{ left: `${t.at * 100}%` }}>
            <span className="block font-semibold">{t.label}</span>
            <span className="num block font-normal text-muted">{short(marks[t.key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Peers() {
  const [when, setWhen] = useState<"nu" | "2031">("nu");
  const now = when === "nu";
  const e = now ? peers.emil : peers.projection2031.emil;
  const f = now ? peers.frederikke : peers.projection2031.frederikke;
  return (
    <Chapter
      id="jaevnaldrende"
      no="06"
      kicker="Pr. person"
      title="Sammenlignet med jævnaldrende"
      intro="Her er pensionen regnet med, men med 40 % skat trukket fra, og aktierne er til markedsværdi. Sådan gør statistikken også."
    >
      <div className="mb-5">
        <Segmented options={[{ value: "nu", label: "I dag" }, { value: "2031", label: "2031 (skøn)" }]} value={when} onChange={setWhen} label="Tidspunkt" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Strip name="Emil" age={e.age} wealth={now ? peers.emil.ourWealth : peers.projection2031.emil.wealth} marks={e} placement={e.placement} color="var(--violet)" />
        <Strip name="Frederikke" age={f.age} wealth={now ? peers.frederikke.ourWealth : peers.projection2031.frederikke.wealth} marks={f} placement={f.placement} color="var(--sky)" />
      </div>
      <p className="mt-4 max-w-3xl text-xs text-muted">
        Kilde: {peers.source} {now ? "" : `${peers.projection2031.note} Tallene for 2031 følger den oprindelige plan.`} Placeringen afhænger meget af, hvad lejligheden er værd.
      </p>
    </Chapter>
  );
}
