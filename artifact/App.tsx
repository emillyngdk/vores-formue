import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Home from "@/app/page";
import { CheckIn } from "@/components/CheckIn";
import { Checklist } from "@/components/Checklist";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import { Chat } from "@/components/ask/Chat";
import { Lab } from "@/components/lab/Lab";
import { PersonView } from "@/components/person/PersonView";

function Huskeliste() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Huskeliste</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,4.5rem)]">Åbne punkter</h1>
      <Checklist />
      <div className="mt-10">
        <Link href="/check-in" className="inline-flex min-h-12 items-center rounded-full border border-line bg-surface px-6 font-semibold">
          Månedlig check-in
        </Link>
      </div>
    </main>
  );
}

function CheckInView() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-14">
      <p className="eyebrow">Månedlig check-in</p>
      <h1 className="display mt-2 text-[clamp(2.2rem,8vw,4.5rem)]">Plan mod virkelighed</h1>
      <p className="mt-3 max-w-xl text-muted sm:text-lg">Én gang om måneden skriver vi de faktiske saldi ind og ser, om vi følger planen.</p>
      <CheckIn />
    </main>
  );
}

export function App() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <Providers>
      <Nav />
      <div id="indhold" className="relative z-10 pb-[var(--bottom-nav)]">
        {path === "/lab" ? (
          <main>
            <Lab />
          </main>
        ) : path === "/spoerg" ? (
          <main>
            <Chat />
          </main>
        ) : path === "/huskeliste" ? (
          <Huskeliste />
        ) : path === "/check-in" ? (
          <CheckInView />
        ) : path === "/emil" || path === "/frederikke" ? (
          <main>
            <PersonView who={path === "/emil" ? "emil" : "frederikke"} />
          </main>
        ) : (
          <Home />
        )}
      </div>
    </Providers>
  );
}
