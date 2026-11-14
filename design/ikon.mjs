// Tegner app-ikonerne. Kør: node design/ikon.mjs (kræver Playwright, kun nødvendig når ikonet ændres)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
// Huset med LM. Taget og L'et/M'et er tegnet som runde streger, så de står skarpt i alle størrelser.
const mark = `<g transform="translate(0 -18)">
  <path d="M116 238L256 120L396 238" fill="none" stroke="#fbe38e" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="326" y="132" width="26" height="54" rx="6" fill="#fbe38e"/>
  <path d="M166 280V392H226M264 392V280L306 340L348 280V392" fill="none" stroke="#fbe38e" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M164 446C220 462 290 460 350 436" fill="none" stroke="#2b5bff" stroke-width="18" stroke-linecap="round"/>
</g>`;
const defs = `<defs>
  <radialGradient id="bg" cx="30%" cy="20%" r="100%"><stop offset="0" stop-color="#4b2d20"/><stop offset=".55" stop-color="#3a2218"/><stop offset="1" stop-color="#2d1911"/></radialGradient>
</defs>`;
export const svg = (kind) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" ${kind === "rounded" ? 'rx="116"' : ""} fill="url(#bg)"/>
  <g ${kind === "maskable" ? 'transform="translate(56 56) scale(.78)"' : ""}>${mark}</g></svg>`;

const jobs = [
  ["public/icons/icon-192.png", 192, "rounded"],
  ["public/icons/icon-512.png", 512, "rounded"],
  ["public/icons/icon-maskable-512.png", 512, "maskable"],
  ["app/apple-icon.png", 180, "square"],
  ["app/icon.png", 64, "rounded"],
];
const pw = await import(process.env.PLAYWRIGHT || "playwright");
const chromium = pw.chromium ?? pw.default.chromium;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
for (const [file, size, kind] of jobs) {
  const p = await (await b.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })).newPage();
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(kind)}`);
  await p.screenshot({ path: path.join(root, file), omitBackground: true });
  await p.close();
}
fs.writeFileSync(path.join(root, "design/ikon.svg"), svg("rounded"));
await b.close();
console.log("ikoner tegnet");
