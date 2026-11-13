import { renderToString } from "react-dom/server";
import { App } from "./App";

/** Forsiden som færdig HTML, så siden har indhold, før JavaScript er hentet */
process.stdout.write(renderToString(<App />));
