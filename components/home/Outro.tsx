import Link from "next/link";
import { meta } from "@/data/household";

export function Outro() {
  return (
    <section aria-labelledby="outro-title" className="hero-glow -mx-4 mt-10 rounded-[32px] px-4 py-16 text-center sm:-mx-6 sm:px-6 sm:py-24">
      <p className="eyebrow">Og hvad nu hvis?</p>
      <h2 id="outro-title" className="display mx-auto mt-3 max-w-3xl text-[clamp(2rem,7vw,4.5rem)]">
        Leg med planen
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg">Skru på afkast, boligpriser og opsparing, eller stil et spørgsmål på almindeligt dansk.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/lab" className="cta inline-flex min-h-12 items-center px-7">Åbn scenarie-lab</Link>
        <Link href="/spoerg" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-7 font-semibold">Spørg Claude</Link>
        <Link href="/check-in" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-7 font-semibold">Månedlig check-in</Link>
      </div>
      <p className="mt-10 text-xs text-muted">
        Tal pr. {meta.dataAsOf} · sidst opdateret {meta.lastUpdated} · alle beløb er nominelle, altså før inflation
      </p>
    </section>
  );
}
