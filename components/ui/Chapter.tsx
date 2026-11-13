/** Fælles ramme om hvert kapitel: nummer, overskrift og én kort indledning */
export function Chapter({
  id,
  no,
  kicker,
  title,
  intro,
  children,
}: {
  id: string;
  no: string;
  kicker: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 py-14 sm:py-24">
      <ChapterHead id={id} no={no} kicker={kicker} title={title} intro={intro} />
      <div className="mt-8 sm:mt-12">{children}</div>
    </section>
  );
}

export function ChapterHead({ id, no, kicker, title, intro, compact = false }: {
  id: string; no: string; kicker: string; title: string; intro?: string; compact?: boolean;
}) {
  return (
    <header>
      <p className="eyebrow">
        <span style={{ color: "var(--accent-text)" }}>{no}</span> · {kicker}
      </p>
      <h2 id={`${id}-title`} className={`display mt-2 ${compact ? "text-[clamp(1.6rem,5vw,3rem)]" : "text-[clamp(2rem,6.5vw,4rem)]"}`}>
        {title}
      </h2>
      {intro && <p className={`mt-3 max-w-2xl text-muted ${compact ? "text-sm sm:text-base" : "sm:text-lg"}`}>{intro}</p>}
    </header>
  );
}
