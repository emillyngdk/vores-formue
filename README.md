# Vores Formue

Privat økonomi-side for Emil og Frederikke. Kun til eget brug. Siden kræver login og er ikke indekseret.

## Kom i gang lokalt
```bash
npm install
npm run dev      # http://localhost:3000 (åben uden kodeord under udvikling)
npm test         # regnemotor og assistentens værktøjer
npm run build
```

## Miljøvariabler
Se `.env.example`.

| Navn | Hvad |
|---|---|
| `SITE_PASSWORD` | Kodeordet til siden. Mangler det i produktion, er siden låst for alle. |
| `ANTHROPIC_API_KEY` | Nøgle til "Spørg Claude". Uden den virker resten af siden stadig. |
| `CLAUDE_MODEL` | Valgfri. Standard er `claude-sonnet-5-5`. |

## Udrulning (Vercel)
1. Læg koden i et privat GitHub-repo og importér det i Vercel under jeres personlige konto, ikke et arbejds-team.
2. Sæt `SITE_PASSWORD` og `ANTHROPIC_API_KEY` under Settings → Environment Variables.
3. Deploy. Tjek bagefter i et privat vindue, at forsiden sender til `/login`, og at en fil under `/_next/static/` svarer 401 uden login.

## Struktur
- `data/household.ts` – alle tal. Eneste sandhedskilde. Ingen CPR-numre, kontonumre eller adresser.
- `lib/engine/` – regnemotoren: `simulate`, `growthBreakdown`, `sensitivity`, `prioritetslaanCost`, `askVsDepot`, `PRESETS`.
- `lib/assistant/` – assistentens systemprompt, værktøjer og ordliste. Alle tal i svarene kommer fra regnemotoren.
- `lib/auth.ts` + `middleware.ts` – adgangslås. Alt kræver login, også JavaScript-filerne.
- `lib/scenario.tsx` – planen og det, man leger med ("Hvad nu hvis"). Deles af forsiden, lab'et og check-in.
- `components/home/` – forsiden. `components/whatif/` – bjælken og skuffen. `components/lab/`, `components/ask/` – værktøjssiderne.
- `app/globals.css` – designtokens "Nat & Rav". Mørk er standard, lys via `data-theme="light"`.

## Sider
- `/` fortællingen · `/lab` scenarie-lab · `/spoerg` Spørg Claude · `/huskeliste` åbne punkter · `/check-in` plan mod virkelighed

## Kendte forenklinger
- Aktiesparekontoen i lab'et: 17 % af årets afkast hver oktober, indskud til loftet er nået.
- Lønstigning i lab'et hæver pension og Nordnet-opsparing i samme takt.
- Skat på aktier i frit depot regnes, som om alt blev solgt samme år.
- Check-ins, gemte scenarier, den gemte plan og flueben i huskelisten ligger kun på den enkelte enhed.
- Engangskøb regnes som en ren udgift. Det købte tæller ikke med i formuen.

## Webapp
Siden kan lægges på hjemmeskærmen som en app: i Safari via Del → Føj til hjemmeskærm, i Chrome via menuen → Installer app.
