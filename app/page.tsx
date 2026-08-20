import Link from "next/link";

const PILLARS = [
  {
    n: "01",
    title: "Compete at the highest level",
    desc: "Structured scrims, ranked pushes, and tournament runs.",
  },
  {
    n: "02",
    title: "Grow. Improve. Adapt.",
    desc: "Real feedback and role-based coaching inside the clan.",
  },
  {
    n: "03",
    title: "Be part of a dedicated team",
    desc: "Active WhatsApp/Discord community, not a ghost town.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-14 pt-16 md:px-8 md:pb-[70px] md:pt-[90px]">
        <div
          className="pointer-events-none absolute right-[-160px] top-1/2 h-[380px] w-[380px] -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.06] grayscale md:right-[-120px] md:h-[640px] md:w-[640px] md:opacity-[0.07]"
          style={{ backgroundImage: "url(/logo.jpg)" }}
        />
        <svg
          className="reticle pointer-events-none absolute right-[6%] top-[18%] hidden h-[140px] w-[140px] text-purple md:block"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="50" cy="50" r="34" strokeWidth="0.75" opacity="0.5" />
          <circle cx="50" cy="50" r="2" fill="currentColor" stroke="none" />
          <line x1="50" y1="2" x2="50" y2="18" strokeWidth="1" />
          <line x1="50" y1="82" x2="50" y2="98" strokeWidth="1" />
          <line x1="2" y1="50" x2="18" y2="50" strokeWidth="1" />
          <line x1="82" y1="50" x2="98" y2="50" strokeWidth="1" />
        </svg>
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="eyebrow">GenXio Esports — Call of Duty Mobile</div>
            <span className="live-dot">Recruiting</span>
          </div>
          <h1 className="font-display max-w-2xl text-[38px] font-bold uppercase leading-[1.02] tracking-tight md:text-[64px]">
            Play. Evolve. <span className="text-purple [text-shadow:0_0_28px_rgba(139,92,246,0.55)]">Dominate.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[13px] leading-[1.7] text-text-dim md:mt-[18px] md:text-[15px]">
            GenXio is a competitive Call of Duty Mobile clan built on discipline, skill, and
            unity. We recruit players who want to get better, not just play — MP grinders, BR
            strategists, and everything in between.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/apply" className="btn btn-primary">
              Join GenXio
            </Link>
            <Link href="/achievements" className="btn btn-outline">
              See our results
            </Link>
          </div>
        </div>
      </section>

      <div className="hazard-stripe" />
      <div className="flex flex-wrap justify-center gap-4 border-b border-line bg-panel/40 px-5 py-7 md:gap-8 md:px-8">
        <div className="stat-readout min-w-[130px] text-center">
          <div className="font-display text-2xl font-bold text-white md:text-[28px]">G¹</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
            Flagship squad
          </div>
        </div>
        <div className="stat-readout min-w-[130px] text-center">
          <div className="font-display text-2xl font-bold text-white md:text-[28px]">MP + BR</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
            Full roster coverage
          </div>
        </div>
        <div className="stat-readout min-w-[130px] text-center">
          <div className="font-display text-2xl font-bold text-white md:text-[28px]">24/7</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
            Active community
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-[70px]">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
          <div>
            <div className="eyebrow mb-2.5">Who we are</div>
            <h2 className="font-display mb-4 text-[26px] font-bold text-white">
              One team. One goal.
            </h2>
            <p className="mb-4 text-sm leading-[1.8] text-text-dim">
              GenXio was built for players who take Call of Duty Mobile seriously — whether
              that&apos;s climbing ranked, running structured scrims, or competing in
              tournaments. We&apos;re not a casual add-anyone Discord; every member is expected
              to show up, communicate, and improve.
            </p>
            <p className="text-sm leading-[1.8] text-text-dim">
              <b className="text-text">Skill. Discipline. Unity.</b> That&apos;s the standard.
              If you&apos;re grinding solo and want a squad that pushes you further, this is
              where you belong.
            </p>
          </div>
          <div className="flex flex-col gap-3.5">
            {PILLARS.map((p) => (
              <div
                key={p.n}
                className="flex gap-3.5 border border-line bg-panel/60 p-4 [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,10px_100%,0_calc(100%-10px))]"
              >
                <div className="font-display shrink-0 text-sm font-bold text-purple [text-shadow:0_0_10px_rgba(139,92,246,0.5)]">
                  {p.n}
                </div>
                <div>
                  <div className="font-display text-[13px] font-semibold tracking-wide text-white">
                    {p.title}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-text-dim">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden border-y border-line bg-panel px-5 py-14 text-center md:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, var(--purple-dim) 0, var(--purple-dim) 1px, transparent 1px, transparent 14px)",
            maskImage: "radial-gradient(ellipse 60% 100% at 50% 50%, black, transparent)",
          }}
        />
        <div className="relative z-10">
          <div className="eyebrow mb-3 justify-center">Roster intake open</div>
          <h2 className="font-display mb-3 text-[28px] font-bold uppercase tracking-tight text-white md:text-[34px]">
            Think you have what it takes?
          </h2>
          <p className="mb-6 text-[13.5px] text-text-dim">
            Applications are reviewed on activity, comms, and in-game skill — not just rank.
          </p>
          <Link href="/apply" className="btn btn-primary">
            Apply to GenXio
          </Link>
        </div>
      </div>
    </>
  );
}
