/** Korte forklaringer, som assistenten kan slå op i */
export const GLOSSARY: Record<string, string> = {
  prioritetslån:
    "Et banklån med en konto tilknyttet. Pengene på PrioritetsKontoen forrentes næsten som lånet, så de trækker den reelle rente ned. Pengene kan stadig hæves frit.",
  prioritetskonto:
    "Kontoen, der hører til prioritetslånet. Den bruges som husstandens hovedkonto. Jo mere der står på den, jo billigere er lånet.",
  friværdi: "Boligens værdi minus den gæld, der er i den. På siden er salæret til mægleren også trukket fra, mens vi ejer lejligheden.",
  afdragsfrit: "Et lån, hvor man kun betaler rente og bidrag. Gælden bliver ikke mindre, men den månedlige udgift er lavere.",
  lagerbeskatning: "Skat, der betales hvert år af årets værdistigning, også selv om man ikke har solgt. Sådan beskattes aktiesparekontoen.",
  aktiesparekonto:
    "En særlig konto til aktier, hvor afkastet beskattes med 17 % hvert år. Der er et loft for, hvor meget man må sætte ind. Kontoen er personlig.",
  realisationsbeskatning: "Skat, der først betales, når man sælger. Sådan beskattes aktier i et almindeligt depot.",
  aktieindkomst: "Gevinst og udbytte fra aktier i frit depot. Beskattes med 27 % op til progressionsgrænsen og 42 % over.",
  progressionsgrænse: "Grænsen for, hvornår aktieindkomst går fra 27 % til 42 % i skat. Den er 79.400 kr. pr. person i 2026.",
  boligrabat: "En rabat på prioritetslånet på 0,25 % af restgælden om året, som udbetales hvert kvartal.",
  realkreditlån: "Lånet i boligen gennem Totalkredit. Vores er afdragsfrit.",
  indefrysning: "En ordning, hvor stigninger i boligskatten kan udskydes som et lån hos staten, til boligen sælges. Vi bruger den ikke.",
  nominelt: "Tal i fremtidens kroner, altså uden at inflationen er trukket fra.",
  salær: "Betalingen til ejendomsmægleren ved salg. Vi regner med 75.000 kr.",
  pension: "Opsparing via lønnen. Den er låst til pensionsalderen og vises før skat, så den regnes ikke med i den frie formue.",
};

export function explainTerm(term: string): { term: string; forklaring: string } | { fejl: string; kendte: string[] } {
  const key = term.trim().toLowerCase();
  const hit = Object.keys(GLOSSARY).find((k) => k === key || key.includes(k) || k.includes(key));
  if (hit) return { term: hit, forklaring: GLOSSARY[hit] };
  return { fejl: `Jeg har ingen forklaring på "${term}" i ordlisten.`, kendte: Object.keys(GLOSSARY) };
}
