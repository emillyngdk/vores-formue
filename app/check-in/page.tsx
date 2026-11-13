import type { Metadata } from "next";
import { CheckIn } from "@/components/CheckIn";

export const metadata: Metadata = { title: "Månedlig check-in · Kistebunden" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Månedlig check-in</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,4.5rem)]">Plan mod virkelighed</h1>
      <p className="mt-3 max-w-xl text-muted sm:text-lg">Én gang om måneden skriver vi de faktiske saldi ind og ser, om vi følger planen.</p>
      <CheckIn />
    </main>
  );
}
