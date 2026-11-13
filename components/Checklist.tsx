"use client";

import { openItems } from "@/data/household";
import { useLocalStorage } from "@/lib/hooks";

export function Checklist() {
  const [done, setDone, loaded, shared] = useLocalStorage<string[]>("vf-huskeliste", []);
  const left = openItems.filter((o) => !done.includes(o.id)).length;
  return (
    <>
      <p className="mt-3 text-muted sm:text-lg" aria-live="polite">
        {loaded ? (left === 0 ? "Alt er klaret." : `${left} af ${openItems.length} mangler.`) : " "}
      </p>
      <ul className="mt-8 space-y-3">
        {openItems.map((o) => {
          const checked = done.includes(o.id);
          return (
            <li key={o.id}>
              <label className="card flex cursor-pointer items-start gap-4 p-5" style={checked ? { opacity: 0.55 } : undefined}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setDone(checked ? done.filter((d) => d !== o.id) : [...done, o.id])}
                  className="mt-1 h-6 w-6 shrink-0"
                  style={{ accentColor: "var(--accent)" }}
                />
                <span>
                  <span className={`block font-semibold ${checked ? "line-through" : ""}`}>{o.title}</span>
                  <span className="mt-1 block text-sm text-muted">{o.detail}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">{shared ? "Fluebenene ligger på siden, så I begge kan se dem." : "Fluebenene gemmes kun på denne enhed."}</p>
    </>
  );
}
