/** Huset med LM fra app-ikonet, med den blå streg under. Brandets egne farver, så det ser ens ud i lyst og mørkt tema. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden className="shrink-0">
      <rect width="512" height="512" rx="116" fill="#3a2218" />
      <g transform="translate(0 -18)">
        <path d="M116 238L256 120L396 238" fill="none" stroke="#fbe38e" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="326" y="132" width="26" height="54" rx="6" fill="#fbe38e" />
        <path d="M166 280V392H226M264 392V280L306 340L348 280V392" fill="none" stroke="#fbe38e" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M164 446C220 462 290 460 350 436" fill="none" stroke="#2b5bff" strokeWidth="22" strokeLinecap="round" />
      </g>
    </svg>
  );
}
