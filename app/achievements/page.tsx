const ACHIEVEMENTS = [
  {
    result: "EDIT ME",
    title: "Sample tournament result",
    desc: "Replace with a real placement, bracket run, or scrim series result. Duplicate this card for each achievement.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 4h3a2 2 0 0 1-2 4M7 4H4a2 2 0 0 0 2 4" />
      </svg>
    ),
  },
  {
    result: "EDIT ME",
    title: "Sample scrim milestone",
    desc: "Use this space for scrim win streaks, ranked season results, or MVP shoutouts.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
      </svg>
    ),
  },
  {
    result: "EDIT ME",
    title: "Sample recognition",
    desc: "Community shoutouts, standout individual performances, or partnership announcements go here.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export default function AchievementsPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pb-5 pt-14 md:px-8 md:pt-[60px]">
        <div className="eyebrow mb-2.5">Track record</div>
        <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-white md:text-[38px]">
          Achievements &amp; Tournaments
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] text-text-dim">
          Results GenXio has earned in scrims, ranked pushes, and tournament brackets.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className="card">
              <div className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center border border-purple-dim text-purple [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
                {a.icon}
              </div>
              <div className="rank-badge mb-2.5">{a.result}</div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-white">{a.title}</h3>
              <p className="text-xs leading-relaxed text-text-dim">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 card text-xs text-text-dim">
          These are placeholder results. Edit the <code>ACHIEVEMENTS</code> array in{" "}
          <code>app/achievements/page.tsx</code> with real tournament placements, scrim
          records, or standout stats.
        </div>
      </div>
    </>
  );
}
