import { signedKr } from "@/lib/format";

/** Forskel mod planen som en lille farvet pille */
export function Delta({ v, suffix, same = "som planen" }: { v: number; suffix?: string; same?: string }) {
  const zero = Math.abs(v) < 500;
  return (
    <span className="num inline-flex items-center rounded-full px-2.5 py-1 text-xs" style={{ background: "var(--surface-2)", color: zero ? "var(--muted)" : v > 0 ? "var(--mint)" : "var(--coral)" }}>
      {zero ? same : `${signedKr(v)}${suffix ? ` ${suffix}` : ""}`}
    </span>
  );
}
