/** Kisten fra app-ikonet, lille nok til menuen. Farverne følger temaet. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d="M4 14.5C4 9.3 8 6 13 6h6c5 0 9 3.3 9 8.5z" fill="var(--violet)" />
      <rect x="5" y="14" width="22" height="3.2" fill="var(--accent)" />
      <path d="M4 16.8h24V24a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="var(--violet)" opacity="0.72" />
      <circle cx="16" cy="21.6" r="2.6" fill="var(--ink)" />
    </svg>
  );
}
