# Lyng Mandal Kapital

Appen hed før "Kistebunden" og "Vores Formue", og repoet og Vercel-projektet hedder stadig `vores-formue`. Kort navn på hjemmeskærmen: "LM Kapital". Privat økonomi-webapp for Emil og Frederikke. Next.js på Vercel. Et push til `main` udruller automatisk.

## Når Emil sender nye tal
1. Ret tallene i `data/household.ts`. Det er den eneste sandhedskilde. Sæt også `meta.dataAsOf` og `meta.lastUpdated`.
2. Kør `npm test`. Testene i `lib/engine/engine.test.ts` under "basis-scenariet år for år" og "salget i oktober 2028" er låst til tallene fra oktober 2026. Når udgangstallene ændres, skal de forventede tal i de tests regnes om med `simulate(BASE)` og rettes, efter at ændringen er tjekket for at give mening. Ret aldrig motoren for at få en test grøn.
3. Kør `npx tsc --noEmit`, `npx eslint app components lib data` og `npm run build`.
4. Commit og push til `main`. Tjek bagefter i Vercel, at udrulningen er grøn.
5. Fortæl Emil kort på dansk, hvad der ændrede sig i formuen i dag og i 2035.

Statiske tekster med tal: `peers` i `data/household.ts` (sammenligningen med jævnaldrende) er regnet i hånden og skal rettes med, hvis formuen pr. person flytter sig mærkbart.

## Regler
- Ingen CPR-numre, kontonumre, adresser eller e-mails i kode eller data.
- Ingen kodeord eller nøgler i repoet. `SITE_PASSWORD` og `ANTHROPIC_API_KEY` ligger kun i Vercels miljøvariabler, og Emil sætter dem selv.
- Siden skal kræve login, have `noindex` og ingen sporing.
- Opfind aldrig tal. Alt, hvad siden viser, skal komme fra `data/household.ts` og regnemotoren.
- Tekst på siden er dansk, kort og almindeligt sprog.

## Overblik
- `data/household.ts`: alle tal.
- `lib/engine/`: regnemotoren (`simulate`, engangskøb, `growthBreakdown`).
- `lib/scenario.tsx`: planen og det, man leger med på forsiden ("Hvad nu hvis").
- `lib/variables.ts`: alle variabler i lab'et (navn, interval, format). En ny variabel skal både i `ScenarioParams` og `BASE` i motoren, i `KEYS` og `LIMITS` i `lib/scenario-url.ts` og her. Planens værdier hentes fra `data/household.ts`.
- `components/home/`: forsiden. `components/whatif/`: bjælken og skuffen. `components/lab/`, `components/ask/`: lab og Spørg Claude.
- `design/ikon.mjs`: tegner app-ikonerne (huset med LM). Køres kun, når ikonet ændres.
- Udtryk: Butter Yellow (60 %), Dark Cocoa (30 %), Electric Blue (10 %). Butter er standard, cocoa er mørk tilstand. Farverne er tokens i `app/globals.css` (`--accent` blå til knapper og hovedlinjen, `--home` bolig, `--blue` aktier/Emil, `--cash` konti, `--caramel` pension/Frederikke, `--mint` plus, `--coral` minus).
- Skrift: Anton til overskrifter og store tal (`.display`, `.fig`), DM Mono til små mærkater (`.eyebrow`), Poppins til resten.
- `artifact/`: bygger den udgave, der kan vises som artifact i Claude (`npm run artifact`).
