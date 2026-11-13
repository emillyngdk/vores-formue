/** I artifact-udgaven kan adressen ikke bære et scenarie, så det huskes i siden, mens den er åben. */
let pending = "";

export const readScenarioQuery = () => pending;

export function writeScenarioQuery(q: string) {
  pending = q;
}

export const setPendingScenario = writeScenarioQuery;
