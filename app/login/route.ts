export const dynamic = "force-dynamic";

/** Login-siden er ren HTML uden JavaScript-filer, så intet af sidens indhold hentes, før man er logget ind. */
export async function GET(req: Request) {
  const failed = new URL(req.url).searchParams.has("fejl");
  const locked = !process.env.SITE_PASSWORD;
  const body = locked
    ? `<p class="msg">Siden er låst. Der er ikke sat et kodeord endnu (miljøvariablen SITE_PASSWORD).</p>`
    : `<form method="post" action="/api/login">
        <label for="pw">Kodeord</label>
        <input id="pw" name="password" type="password" autocomplete="current-password" required />
        ${failed ? `<p class="err" role="alert">Forkert kodeord. Prøv igen.</p>` : ""}
        <button type="submit">Log ind</button>
      </form>`;
  const html = `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Log ind · Vores Formue</title>
<link rel="icon" href="/icons/icon-192.png" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: #0b1026; color: #f4f1ea;
    font-family: Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background-image: radial-gradient(40% 40% at 30% 30%, rgba(255,181,71,.18), transparent 70%), radial-gradient(40% 40% at 70% 70%, rgba(139,108,255,.2), transparent 70%); }
  main { width: 100%; max-width: 400px; background: #141a38; border: 1px solid rgba(255,255,255,.08); border-radius: 28px; padding: 32px; }
  h1 { margin: 0 0 4px; font-size: 2rem; font-weight: 800; text-transform: uppercase; letter-spacing: -.02em; line-height: 1; }
  .sub { margin: 0 0 28px; color: #9aa0c3; }
  label { display: block; font-size: .875rem; font-weight: 600; margin-bottom: 6px; }
  input { width: 100%; min-height: 52px; border-radius: 16px; border: 1px solid rgba(255,255,255,.14); background: #1c2350; color: inherit; font-size: 1rem; padding: 0 16px; }
  input:focus-visible, button:focus-visible { outline: 2px solid #ffb547; outline-offset: 3px; }
  button { width: 100%; min-height: 52px; margin-top: 20px; border: 0; border-radius: 999px; background: #ffb547; color: #0b1026; font-size: 1rem; font-weight: 700; cursor: pointer; }
  .err { color: #ff6b5b; font-size: .875rem; font-weight: 600; margin: 10px 0 0; }
  .msg { color: #9aa0c3; margin: 0; }
</style>
</head>
<body>
<main>
  <h1>Vores Formue</h1>
  <p class="sub">Privat side. Log ind for at fortsætte.</p>
  ${body}
</main>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
