/** Huset med LM fra app-ikonet. Brandets egne farver, så det ser ens ud i lyst og mørkt tema. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="512" height="512" rx="116" fill="#0f3b2e" />
      <path d="M116 238L256 120L396 238" fill="none" stroke="#d9a93f" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="326" y="132" width="26" height="54" rx="6" fill="#d9a93f" />
      <path d="M166 280V392H226M264 392V280L306 340L348 280V392" fill="none" stroke="#e8bd55" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
