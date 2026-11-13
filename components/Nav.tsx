"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Overblik", icon: "M4 19V10m5 9V5m5 14v-7m5 7V8" },
  { href: "/lab", label: "Lab", icon: "M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5v5M9 14.5v5" },
  { href: "/spoerg", label: "Spørg", icon: "M5 5h14v10H10l-5 4V5z" },
  { href: "/huskeliste", label: "Husk", icon: "M5 7l2 2 3-4M5 16l2 2 3-4M13 7h6M13 16h6" },
] as const;

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <header className="glass top-0 z-40 border-b border-line md:sticky">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="display flex min-h-11 items-center gap-2.5 text-sm tracking-[0.12em]">
            <Logo />
            Kistebunden
          </Link>
          <nav aria-label="Hovedmenu" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active(l.href) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
              >
                {l.href === "/spoerg" ? "Spørg Claude" : l.href === "/huskeliste" ? "Huskeliste" : l.href === "/lab" ? "Scenarie-lab" : l.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Bundmenu"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active(l.href) ? "" : "text-muted"}`}
                style={active(l.href) ? { color: "var(--accent-text)" } : undefined}
              >
                <Icon d={l.icon} />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
