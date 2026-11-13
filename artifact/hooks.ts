"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtifactDb, DbDoc } from "./claude";

export * from "../lib/hooks";

/**
 * Artifact-udgaven af useLocalStorage: tallene ligger i artifactens delte lager (db),
 * så de er de samme for alle, der har adgang, og på alle enheder.
 * Uden lageret falder den tilbage til enheden selv.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [shared, setShared] = useState(false);
  const doc = useRef<DbDoc | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* brug startværdien */
    }
    // Vent højst 10 sekunder på lageret, før siden viser det, den har
    const timer = window.setTimeout(() => setLoaded(true), 10_000);
    const done = () => {
      window.clearTimeout(timer);
      setLoaded(true);
    };
    (async () => {
      const db = (await window.claude?.use("db").catch(() => null)) as ArtifactDb | null | undefined;
      if (cancelled) return;
      if (!db) return done();
      const ref = db.doc(`state/${key.replace(/^vf-/, "")}`);
      doc.current = ref;
      setShared(true);
      unsubscribe = ref.onSnapshot(
        (snap) => {
          const body = snap.exists ? snap.data() : undefined;
          if (body && "value" in body) setValue(body.value as T);
          if (!snap.metadata.fromCache) done();
        },
        () => {
          doc.current = null;
          setShared(false);
          done();
        },
      );
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [key]);

  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* gælder kun til siden lukkes */
      }
      // Én skrivning ad gangen pr. dokument
      queue.current = queue.current.then(async () => {
        try {
          await doc.current?.set({ value: v as unknown });
        } catch {
          /* fx kun læseadgang: værdien bliver på enheden */
        }
      });
    },
    [key],
  );

  return [value, set, loaded, shared] as const;
}
