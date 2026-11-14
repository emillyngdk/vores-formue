"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Delta } from "@/components/ui/Delta";
import { Range } from "@/components/ui/Range";
import { Segmented } from "@/components/ui/Segmented";
import { Spark } from "@/components/ui/Spark";
import { Ticker } from "@/components/ui/Ticker";
import { effectiveCut, housingCostMonthly } from "@/lib/engine";
import { kr, mioTal, pct, tal } from "@/lib/format";
import { useScenario } from "@/lib/scenario";
import { EventFields } from "./EventFields";

type Open = "apartment" | "house" | "move" | "returns" | "saving" | `event:${string}`;

const TITLES: Record<string, string> = {
  apartment: "Hvad er lejligheden værd?",
  house: "Hvad koster huset?",
  move: "Hvornår flytter vi?",
  returns: "Hvad giver pengene i afkast?",
  saving: "Hvor meget sætter vi i Nordnet?",
};

function Chip({
  id, label, value, changed, active, off, onClick,
}: {
  id: string; label: string; value: string; changed: boolean; active: boolean; off?: boolean; onClick: (el: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      data-chip={id}
      aria-expanded={active}
      aria-haspopup="dialog"
      onClick={(e) => onClick(e.currentTarget)}
      className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors"
      style={{
        borderColor: active ? "var(--ink)" : changed ? "var(--accent)" : "var(--line)",
        background: changed ? "color-mix(in srgb, var(--accent) 16%, var(--surface))" : "var(--surface)",
        opacity: off ? 0.55 : 1,
      }}
    >
      <span className="text-muted">{label}</span>
      <span className="num" style={off ? { textDecoration: "line-through" } : undefined}>{value}</span>
    </button>
  );
}

function BackToPlan({ show, onClick, text }: { show: boolean; onClick: () => void; text: string }) {
  if (!show) return null;
  return (
    <button type="button" onClick={onClick} className="mt-1 min-h-11 text-sm font-semibold underline underline-offset-4" style={{ color: "var(--accent-text)" }}>
      Tilbage til planen ({text})
    </button>
  );
}

/** Bjælken øverst på forsiden: jeres antagelser som knapper. Et tryk åbner én ting ad gangen. */
export function WhatIfBar() {
  const sc = useScenario();
  const { draft: d, plan, sim, changed, delta } = sc;
  const [open, setOpen] = useState<Open | null>(null);
  const [left, setLeft] = useState(16);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useDragControls();

  // Andre fastgjorte afsnit skal vide, hvor høj bjælken er
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty("--whatif-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => {
      ro.disconnect();
      root.style.setProperty("--whatif-h", "0px");
    };
  }, []);

  // Luk ved tryk udenfor og med Escape
  useEffect(() => {
    if (!open) return;
    // Et tryk udenfor lukker. At scrolle siden bagved gør ikke, så man kan se tallene flytte sig.
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sheet.current?.contains(t) || (t instanceof Element && t.closest("[data-chip]"))) return;
      setOpen(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const chip = bar.current?.querySelector<HTMLElement>(`[data-chip="${open}"]`);
      setOpen(null);
      chip?.focus();
    };
    document.addEventListener("click", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2600);
    return () => window.clearTimeout(t);
  }, [saved]);

  const events = d.events ?? [];
  const openEvent = open?.startsWith("event:") ? events.find((e) => `event:${e.id}` === open) : undefined;
  useEffect(() => {
    if (open?.startsWith("event:") && !openEvent) setOpen(null);
  }, [open, openEvent]);

  // Den valgte knap ruller ind midt i rækken
  useEffect(() => {
    const row = scroller.current;
    const chip = open ? row?.querySelector<HTMLElement>(`[data-chip="${open}"]`) : null;
    if (!row || !chip) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [open, events.length]);

  const toggle = (id: Open) => (el: HTMLElement) => {
    setLeft(Math.max(16, Math.min(el.getBoundingClientRect().left, window.innerWidth - 436)));
    setOpen((o) => (o === id ? null : id));
  };
  const add = (el: HTMLElement) => {
    const id = sc.addEvent();
    setLeft(Math.max(16, Math.min(el.getBoundingClientRect().left, window.innerWidth - 436)));
    setOpen(`event:${id}`);
  };

  const saleYear = 2026 + d.saleMonth / 12;
  const end = sim.rows[sim.rows.length - 1].wealthWithPension;
  const sale = sim.sale;
  const title = openEvent ? "Engangskøb" : open ? TITLES[open] : "";
  const returnsChanged = d.stockReturn !== plan.stockReturn || d.pensionReturn !== plan.pensionReturn || d.houseGrowth !== plan.houseGrowth;
  const savingChanged = d.nordnetEmil !== plan.nordnetEmil || d.nordnetFrederikke !== plan.nordnetFrederikke;
  const planEvents = plan.events ?? [];

  return (
    <>
      <div ref={bar} className="glass sticky top-[var(--top-nav)] z-30 border-b border-line">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div ref={scroller} className="whatif-scroll relative -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0" role="toolbar" aria-label="Hvad nu hvis">
            <span className="eyebrow shrink-0 pr-1 text-[0.6875rem] sm:text-xs">Hvad nu hvis</span>
            <Chip id="apartment" label="Lejlighed" value={mioTal(d.apartmentValue)} changed={d.apartmentValue !== plan.apartmentValue} active={open === "apartment"} onClick={toggle("apartment")} />
            <Chip id="house" label="Hus" value={mioTal(d.housePrice)} changed={d.housePrice !== plan.housePrice} active={open === "house"} onClick={toggle("house")} />
            <Chip id="move" label="Flytning" value={String(saleYear)} changed={d.saleMonth !== plan.saleMonth} active={open === "move"} onClick={toggle("move")} />
            <Chip id="returns" label="Aktieafkast" value={pct(d.stockReturn, 1)} changed={returnsChanged} active={open === "returns"} onClick={toggle("returns")} />
            <Chip id="saving" label="Nordnet" value={`${tal(d.nordnetEmil + d.nordnetFrederikke)} kr./md.`} changed={savingChanged} active={open === "saving"} onClick={toggle("saving")} />
            {events.map((e) => (
              <Chip
                key={e.id}
                id={`event:${e.id}`}
                label={`${e.label || "Køb"} ${e.year}`}
                value={`${tal(e.amount)} kr.`}
                changed={!planEvents.some((x) => JSON.stringify(x) === JSON.stringify(e))}
                active={open === `event:${e.id}`}
                off={!e.on}
                onClick={toggle(`event:${e.id}`)}
              />
            ))}
            {events.length < 6 && (
              <button type="button" onClick={(e) => add(e.currentTarget)} data-chip="add" className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-line px-3.5 text-[13px] font-semibold">
                <span aria-hidden className="text-base leading-none">＋</span> Køb, fx bil
              </button>
            )}
            <Link
              href="/lab"
              onClick={() => {
                try {
                  sessionStorage.setItem("vf-lab-focus", "variabler");
                } catch {
                  /* så lander man bare øverst i lab'et */
                }
              }}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap py-2 pl-2 pr-8 text-[13px] font-semibold text-muted underline underline-offset-4"
            >
              Alle variabler
            </Link>
          </div>

          {(changed || !sc.planIsOriginal || saved) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 text-sm" aria-live="polite">
              {changed ? (
                <>
                  <Delta v={delta} suffix="i 2035" same="samme formue i 2035" />
                  <span className="hidden text-muted sm:inline">i forhold til planen</span>
                  <span className="ml-auto flex gap-2">
                    <button type="button" onClick={sc.reset} className="min-h-11 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold">
                      Nulstil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sc.savePlan();
                        setSaved(true);
                        setOpen(null);
                      }}
                      className="cta min-h-11 px-4 text-[13px]"
                    >
                      Gem som plan
                    </button>
                  </span>
                </>
              ) : saved ? (
                <span className="py-2 font-semibold" style={{ color: "var(--mint)" }}>
                  Gemt. Det er jeres plan nu{sc.shared ? ", for jer begge" : " på denne enhed"}.
                </span>
              ) : (
                <>
                  <span className="text-muted">I ser jeres gemte plan.</span>
                  {confirm ? (
                    <span className="ml-auto flex gap-2">
                      <button type="button" onClick={() => setConfirm(false)} className="min-h-11 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold">
                        Behold
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sc.restoreOriginal();
                          setConfirm(false);
                        }}
                        className="min-h-11 rounded-full border px-4 text-[13px] font-semibold"
                        style={{ borderColor: "var(--coral)", color: "var(--coral)" }}
                      >
                        Slet den
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirm(true)} className="ml-auto min-h-11 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold">
                      Oprindelig plan
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={sheet}
            key="sheet"
            role="dialog"
            aria-label={title}
            data-lenis-prevent
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) setOpen(null);
            }}
            className="whatif-sheet fixed inset-x-0 bottom-[var(--bottom-nav)] z-40 max-h-[72svh] overflow-y-auto rounded-t-[28px] border-t border-line bg-surface p-5 md:inset-x-auto md:bottom-auto md:left-[var(--x)] md:top-[calc(var(--top-nav)+var(--whatif-h)+8px)] md:max-h-[calc(100svh-var(--top-nav)-var(--whatif-h)-32px)] md:w-[420px] md:rounded-[28px] md:border"
            style={{ "--x": `${left}px`, boxShadow: "0 -12px 40px rgba(0,0,0,.35)", paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" } as React.CSSProperties}
          >
            {/* Håndtag: træk ned for at lukke */}
            <div className="-mt-5 flex h-8 cursor-grab touch-none items-center justify-center md:hidden" onPointerDown={(e) => drag.start(e)} aria-hidden>
              <span className="h-1.5 w-11 rounded-full" style={{ background: "var(--muted)", opacity: 0.45 }} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold leading-tight">{title}</h2>
              <button type="button" onClick={() => setOpen(null)} aria-label="Luk" className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-muted">
                ×
              </button>
            </div>

            <div className="mt-4">
              {open === "apartment" && (
                <>
                  <Range label="Værdi i dag" value={d.apartmentValue} min={6_000_000} max={8_000_000} step={50_000} onChange={(v) => sc.set("apartmentValue", v)} display={`${mioTal(d.apartmentValue)} kr.`} color="var(--mint)" />
                  <p className="mt-1 text-sm text-muted" style={sale && sale.surplus < 0 ? { color: "var(--coral)" } : undefined}>
                    Friværdi i dag <span className="num text-ink">{kr(sim.rows[0].equity)}</span>
                    {d.apartmentGrowth !== 0 && sale && ` · salgspris ${mioTal(sale.salePrice)} kr. i ${saleYear}`}
                    {sale && (sale.surplus < 0 ? `. Der mangler ${kr(-sale.surplus)} ved hushandlen i ${saleYear}.` : ` · ${kr(sale.perPerson)} til hver efter hushandlen`)}
                  </p>
                  <BackToPlan show={d.apartmentValue !== plan.apartmentValue} onClick={() => sc.set("apartmentValue", plan.apartmentValue)} text={mioTal(plan.apartmentValue)} />
                </>
              )}
              {open === "house" && (
                <>
                  <Range label="Husets pris" value={d.housePrice} min={5_500_000} max={8_000_000} step={50_000} onChange={sc.setHousePrice} display={`${mioTal(d.housePrice)} kr.`} color="var(--mint)" />
                  <p className="mt-2 text-sm text-muted">
                    {Math.round(d.downPaymentPct * 100)} % i udbetaling. Lånet koster ca. {kr(Math.round(housingCostMonthly(d.housePrice, d.downPaymentPct, d.newLoanRate) / 100) * 100)} om måneden i rente og bidrag, så Nordnet sættes {effectiveCut(d) >= 0 ? `ned med ${kr(effectiveCut(d))}` : `op med ${kr(-effectiveCut(d))}`} hver efter flytningen.
                  </p>
                  <BackToPlan show={d.housePrice !== plan.housePrice} onClick={() => sc.setHousePrice(plan.housePrice)} text={mioTal(plan.housePrice)} />
                </>
              )}
              {open === "move" && (
                <>
                  <Segmented options={[2027, 2028, 2029, 2030].map((y) => ({ value: y, label: String(y) }))} value={saleYear} onChange={(y) => sc.set("saleMonth", (y - 2026) * 12)} label="Hvornår flytter vi" size="sm" />
                  <p className="mt-3 text-sm text-muted">Lejligheden sælges, og huset købes i oktober det år.</p>
                </>
              )}
              {open === "returns" && (
                <div className="space-y-5">
                  <Range label="Aktier om året" value={d.stockReturn} min={0.02} max={0.12} step={0.005} onChange={(v) => sc.set("stockReturn", v)} display={pct(d.stockReturn, 1)} color="var(--choc)" />
                  <Range label="Pension om året" value={d.pensionReturn} min={0.01} max={0.07} step={0.005} onChange={(v) => sc.set("pensionReturn", v)} display={pct(d.pensionReturn, 1)} color="var(--caramel)" />
                  <Range label="Huspriser om året, efter købet" value={d.houseGrowth} min={0} max={0.07} step={0.005} onChange={(v) => sc.set("houseGrowth", v)} display={pct(d.houseGrowth, 1)} color="var(--mint)" />
                </div>
              )}
              {open === "saving" && (
                <div className="space-y-5">
                  <Range label="Emil pr. måned" value={d.nordnetEmil} min={0} max={15_000} step={500} onChange={(v) => sc.set("nordnetEmil", v)} display={kr(d.nordnetEmil)} color="var(--choc)" />
                  <Range label="Frederikke pr. måned" value={d.nordnetFrederikke} min={0} max={15_000} step={500} onChange={(v) => sc.set("nordnetFrederikke", v)} display={kr(d.nordnetFrederikke)} color="var(--caramel)" />
                  <p className="text-sm text-muted">
                    {effectiveCut(d) >= 0 ? `Efter flytningen trækkes ${kr(effectiveCut(d))} fra hos hver, fordi huset koster mere.` : `Efter flytningen kan hver sætte ${kr(-effectiveCut(d))} mere ind, fordi huset er billigere.`}
                  </p>
                </div>
              )}
              {openEvent && <EventFields event={openEvent} />}
            </div>

            <div className="mt-3 flex items-center gap-4 rounded-2xl bg-surface-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">Formue i 2035</p>
                <p className="mt-0.5 text-lg leading-tight">
                  <Ticker value={end} />
                </p>
                <p className="mt-1 h-6">{changed && <Delta v={delta} />}</p>
                {open === "apartment" && (
                  <p className="mt-1 text-xs text-muted">
                    I dag <Ticker value={sim.rows[0].wealthWithPension} className="text-ink" />
                  </p>
                )}
              </div>
              <Spark className="h-14 min-w-0 flex-1" values={sim.rows.map((r) => r.wealthWithPension)} plan={changed ? sc.planSim.rows.map((r) => r.wealthWithPension) : undefined} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
