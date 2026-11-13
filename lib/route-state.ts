/** Scenariet i lab'et ligger i adressen (?sr=0.09…), så det kan deles og åbnes fra chatten. */
export const readScenarioQuery = () => window.location.search.replace(/^\?/, "");

export function writeScenarioQuery(q: string) {
  window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
}
