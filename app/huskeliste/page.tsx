import type { Metadata } from "next";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";

export const metadata: Metadata = { title: "Huskeliste · Kistebunden" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Huskeliste</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,4.5rem)]">Åbne punkter</h1>
      <Checklist />
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/check-in" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-6 font-semibold">
          Månedlig check-in
        </Link>
        <form method="post" action="/api/logout">
          <button type="submit" className="min-h-12 rounded-full border border-line px-6 font-semibold text-muted">
            Log ud
          </button>
        </form>
      </div>
    </main>
  );
}
