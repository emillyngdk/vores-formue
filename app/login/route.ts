export const dynamic = "force-dynamic";

/** Login-siden er ren HTML uden JavaScript-filer, så intet af sidens indhold hentes, før man er logget ind. Kun et lille script til øjet i kodeordsfeltet. */
export async function GET(req: Request) {
  const failed = new URL(req.url).searchParams.has("fejl");
  const locked = !process.env.SITE_PASSWORD;
  const body = locked
    ? `<p class="msg">Siden er låst. Der er ikke sat et kodeord endnu (miljøvariablen SITE_PASSWORD).</p>`
    : `<form method="post" action="/api/login">
        <label for="pw">Kodeord</label>
        <div class="field">
          <input id="pw" name="password" type="password" autocomplete="current-password" required />
          <button type="button" class="eye" id="eye" aria-label="Vis kodeord" aria-pressed="false" hidden>
            <svg class="on" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="off" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.5 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
        ${failed ? `<p class="err" role="alert">Forkert kodeord. Prøv igen.</p>` : ""}
        <button type="submit" class="go">Log ind</button>
      </form>`;
  const html = `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Log ind · Lyng Mandal Kapital</title>
<link rel="icon" href="/icons/icon-192.png" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: #0a1d17; color: #f4efe3;
    font-family: Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background-image: radial-gradient(40% 40% at 30% 30%, rgba(226,181,79,.14), transparent 70%), radial-gradient(45% 45% at 70% 70%, rgba(47,138,97,.32), transparent 70%); }
  main { width: 100%; max-width: 400px; background: #10291f; border: 1px solid rgba(244,239,227,.09); border-radius: 28px; padding: 32px; }
  h1 { margin: 0 0 6px; font-size: 1.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: -.02em; line-height: 1.05; }
  .sub { margin: 0 0 28px; color: #9db1a6; }
  label { display: block; font-size: .875rem; font-weight: 600; margin-bottom: 6px; }
  input { width: 100%; min-height: 52px; border-radius: 16px; border: 1px solid rgba(244,239,227,.14); background: #173628; color: inherit; font-size: 1rem; padding: 0 16px; }
  input:focus-visible, button:focus-visible { outline: 2px solid #e2b54f; outline-offset: 3px; }
  .go { width: 100%; min-height: 52px; margin-top: 20px; border: 0; border-radius: 999px; background: #e2b54f; color: #0a1d17; font-size: 1rem; font-weight: 700; cursor: pointer; }
  .field { position: relative; }
  .field input { padding-right: 56px; }
  .eye { position: absolute; right: 4px; top: 4px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 12px; background: transparent; color: #9db1a6; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .eye[hidden] { display: none; }
  .eye .off, .eye[aria-pressed="true"] .on { display: none; }
  .eye[aria-pressed="true"] .off { display: block; }
  .eye[aria-pressed="true"] { color: #f4efe3; }
  .err { color: #f0727a; font-size: .875rem; font-weight: 600; margin: 10px 0 0; }
  .msg { color: #9db1a6; margin: 0; }
  .mark { display: block; margin: 0 0 20px; border-radius: 18px; }
</style>
</head>
<body>
<main>
  <img class="mark" src="/icons/icon-192.png" width="72" height="72" alt="" />
  <h1>Lyng Mandal Kapital</h1>
  <p class="sub">Privat side. Log ind for at fortsætte.</p>
  ${body}
</main>
<script>
  // Øjet vises kun, når JavaScript virker. Uden det er feltet et almindeligt kodeordsfelt.
  (function () {
    var eye = document.getElementById("eye"), pw = document.getElementById("pw");
    if (!eye || !pw) return;
    eye.hidden = false;
    eye.addEventListener("click", function () {
      var show = pw.type === "password";
      pw.type = show ? "text" : "password";
      eye.setAttribute("aria-pressed", String(show));
      eye.setAttribute("aria-label", show ? "Skjul kodeord" : "Vis kodeord");
      pw.focus();
    });
  })();
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
