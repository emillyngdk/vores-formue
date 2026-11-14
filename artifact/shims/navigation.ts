import { useSyncExternalStore } from "react";

const VIEWS: Record<string, string> = { overblik: "/", lab: "/lab", spoerg: "/spoerg", huskeliste: "/huskeliste", "check-in": "/check-in", emil: "/emil", frederikke: "/frederikke" };

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const current = () => VIEWS[window.location.hash.replace(/^#/, "")] ?? "/";

/** Erstatter next/navigation: stien læses fra adressens #navn */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, current, () => "/");
}
