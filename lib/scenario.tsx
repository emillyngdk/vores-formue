"use client";

import { createContext, useCallback, useContext, useDeferredValue, useMemo, useState } from "react";
import { BASE, type PlanEvent, type ScenarioParams, type SimulationResult, growthBreakdown, simulate } from "@/lib/engine";
import { useLocalStorage } from "@/lib/hooks";
import { decodeScenario, encodeScenario } from "@/lib/scenario-url";

type Growth = ReturnType<typeof growthBreakdown>;

interface ScenarioState {
  /** Det, siden viser lige nu: planen plus de ændringer, man leger med */
  draft: ScenarioParams;
  sim: SimulationResult;
  growth: Growth;
  /** Den gemte plan. Er intet gemt, er det den oprindelige plan. */
  plan: ScenarioParams;
  planSim: SimulationResult;
  changed: boolean;
  planIsOriginal: boolean;
  /** Forskel i 2035 med pension, kladde mod plan */
  delta: number;
  /** Forskel i dag med pension, kladde mod plan */
  deltaNow: number;
  shared: boolean;
  setDraft: (p: ScenarioParams) => void;
  set: <K extends keyof ScenarioParams>(k: K, v: ScenarioParams[K]) => void;
  setHousePrice: (v: number) => void;
  reset: () => void;
  savePlan: () => void;
  restoreOriginal: () => void;
  addEvent: () => string;
  updateEvent: (id: string, patch: Partial<PlanEvent>) => void;
  removeEvent: (id: string) => void;
}

const baseSim = simulate(BASE);
const fallback: ScenarioState = {
  draft: BASE, sim: baseSim, growth: growthBreakdown(baseSim), plan: BASE, planSim: baseSim, changed: false, planIsOriginal: true, delta: 0, deltaNow: 0, shared: false,
  setDraft: () => {}, set: () => {}, setHousePrice: () => {}, reset: () => {}, savePlan: () => {}, restoreOriginal: () => {},
  addEvent: () => "", updateEvent: () => {}, removeEvent: () => {},
};

const Ctx = createContext<ScenarioState>(fallback);
export const useScenario = () => useContext(Ctx);
/** Til afsnit længere nede på siden: de må gerne komme et øjeblik efter, så skyderen aldrig hakker. */
export const useScenarioCalm = () => useDeferredValue(useContext(Ctx));

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [planQ, setPlanQ, , shared] = useLocalStorage<string>("vf-plan", "");
  // null betyder: følg planen. Så rammer en plan, der hentes lidt senere, også siden.
  const [own, setOwn] = useState<ScenarioParams | null>(null);

  const plan = useMemo(() => (planQ ? decodeScenario(planQ) : BASE), [planQ]);
  const draft = own ?? plan;
  const planSim = useMemo(() => simulate(plan), [plan]);
  const sim = useMemo(() => (draft === plan ? planSim : simulate(draft)), [draft, plan, planSim]);
  const growth = useMemo(() => growthBreakdown(sim), [sim]);
  const changed = encodeScenario(draft) !== encodeScenario(plan);

  const setDraft = useCallback((p: ScenarioParams) => setOwn(p), []);
  const edit = useCallback((fn: (p: ScenarioParams) => ScenarioParams) => setOwn((old) => fn(old ?? plan)), [plan]);

  const value = useMemo<ScenarioState>(() => {
    const events = (p: ScenarioParams) => p.events ?? [];
    return {
      draft, sim, growth, plan, planSim, changed, shared,
      planIsOriginal: planQ === "",
      delta: sim.rows[sim.rows.length - 1].wealthWithPension - planSim.rows[planSim.rows.length - 1].wealthWithPension,
      deltaNow: sim.rows[0].wealthWithPension - planSim.rows[0].wealthWithPension,
      setDraft,
      set: (k, v) => edit((p) => ({ ...p, [k]: v })),
      // Et dyrere hus koster mere i rente hver måned. Det regner motoren selv ind i Nordnet-opsparingen.
      setHousePrice: (v) => edit((p) => ({ ...p, housePrice: v })),
      reset: () => setOwn(null),
      savePlan: () => {
        setPlanQ(encodeScenario(draft));
        setOwn(null);
      },
      restoreOriginal: () => {
        setPlanQ("");
        setOwn(null);
      },
      addEvent: () => {
        const id = `e${Date.now().toString(36)}`;
        edit((p) => ({ ...p, events: [...events(p), { id, label: "Bil", amount: 300_000, year: 2029, pay: "aktier" as const, loanYears: 7, loanRate: 0.05, on: true }].slice(0, 6) }));
        return id;
      },
      updateEvent: (id, patch) => edit((p) => ({ ...p, events: events(p).map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEvent: (id) =>
        edit((p) => {
          const left = events(p).filter((e) => e.id !== id);
          const { events: _drop, ...rest } = p;
          void _drop;
          return left.length ? { ...rest, events: left } : rest;
        }),
    };
  }, [draft, sim, growth, plan, planSim, changed, shared, planQ, setDraft, edit, setPlanQ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
