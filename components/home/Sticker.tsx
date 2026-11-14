import { pct } from "@/lib/format";

/** Det runde mærke ved overskriften: den årlige vækst frem til 2035, med en tekstring der drejer langsomt. */
export function Sticker({ value }: { value: number }) {
  const text = pct(value, 1);
  return (
    <div className="sticker relative shrink-0" role="img" aria-label={`Vækst ca. ${text} om året frem til 2035`}>
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
        <defs>
          <path id="sticker-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="var(--accent)" />
        <g className="sticker-spin">
          <text fontFamily="var(--font-mono)" fontWeight="500" fontSize="17" fill="var(--on-accent)" letterSpacing="2">
            <textPath href="#sticker-ring" textLength="462" lengthAdjust="spacing">
              VÆKST OM ÅRET · FREM TIL 2035 ·
            </textPath>
          </text>
        </g>
        <text x="100" y="116" textAnchor="middle" fontFamily="var(--font-display)" fontSize="46" fill="var(--on-accent)">
          {text.replace(" %", "%")}
        </text>
      </svg>
    </div>
  );
}
