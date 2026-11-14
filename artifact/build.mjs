// Bygger artifact-udgaven: én HTML-fil med indlejret CSS + ét script.
// Kør `npm run build` først, så den færdige Tailwind-CSS findes i .next.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "artifact-dist");
fs.mkdirSync(out, { recursive: true });

const SWAP = {
  "next/link": "artifact/shims/link.tsx",
  "next/navigation": "artifact/shims/navigation.ts",
  "@/components/ThemeToggle": "artifact/shims/theme-toggle.tsx",
  "@/components/Providers": "artifact/shims/providers.tsx",
  "@/lib/env": "artifact/env.ts",
  "@/lib/hooks": "artifact/hooks.ts",
  "@/lib/route-state": "artifact/route-state.ts",
  "@/lib/ask-client": "artifact/ask-client.ts",
};
const swap = {
  name: "artifact-swap",
  setup(b) {
    b.onResolve({ filter: /^(next\/|@\/)/ }, (args) => (SWAP[args.path] ? { path: path.join(root, SWAP[args.path]) } : undefined));
  },
};
const common = {
  bundle: true,
  plugins: [swap],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  tsconfig: path.join(root, "tsconfig.json"),
  logLevel: "warning",
};

await build({ ...common, entryPoints: [path.join(root, "artifact/main.tsx")], outfile: path.join(out, "app.js"), format: "iife", platform: "browser", target: "es2020", minify: true, legalComments: "none" });
await build({ ...common, entryPoints: [path.join(root, "artifact/prerender.tsx")], outfile: path.join(out, "prerender.cjs"), format: "cjs", platform: "node", target: "node20" });
const html = execFileSync("node", [path.join(out, "prerender.cjs")], { maxBuffer: 32 * 1024 * 1024 }).toString();
fs.rmSync(path.join(out, "prerender.cjs"));

const cssDir = path.join(root, ".next/static/chunks");
let css = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
css = css.replace(/@font-face\s*\{[^}]*\}/g, ""); // Skrifterne hentes fra Google Fonts i stedet
if (/url\(\s*["']?(?:\.\.?\/|\/|https?:)/.test(css)) throw new Error("CSS'en henviser stadig til eksterne filer");
css += "\n" + fs.readFileSync(path.join(root, "artifact/extra.css"), "utf8");

const page = `<title>Lyng Mandal Kapital</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400..800&display=swap">
<style>
${css}
</style>
<div id="root">${html}</div>
<script src="app.js" defer></script>
`;
fs.writeFileSync(path.join(out, "index.html"), page);
const kb = (f) => Math.round(fs.statSync(path.join(out, f)).size / 1024);
console.log(`index.html ${kb("index.html")} kB · app.js ${kb("app.js")} kB`);
