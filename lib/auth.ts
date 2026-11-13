/** Enkel adgangslås med ét fælles kodeord (miljøvariablen SITE_PASSWORD). Virker både i middleware og i route handlers. */
export const SESSION_COOKIE = "vf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dage

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Cookie-værdien er en HMAC af en fast tekst med kodeordet som nøgle. Kodeordet selv gemmes aldrig i browseren. */
export async function sessionToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode("vores-formue-session-v1")));
}

/** Sammenligning, der tager lige lang tid uanset hvor forskellen er */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** true når siden skal være åben uden login: kun under lokal udvikling uden kodeord */
export const openInDev = () => !process.env.SITE_PASSWORD && process.env.NODE_ENV !== "production";
