const POSTS = [
  {
    date: "EDIT ME",
    tag: "Announcement",
    title: "Sample announcement — replace with your own",
    body: "This is placeholder news content. Swap in real roster updates, scrim results, or clan announcements here — duplicate this block for each new post.",
  },
  {
    date: "EDIT ME",
    tag: "Roster",
    title: "Another sample post",
    body: "Use this space for things like new member welcomes, role changes, or scrim schedules. Delete this placeholder once you've added real posts.",
  },
];

export default function NewsPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pb-5 pt-14 md:px-8 md:pt-[60px]">
        <div className="mb-2.5 flex flex-wrap items-center gap-4">
          <div className="eyebrow">Clan updates</div>
          <span className="live-dot">Live feed</span>
        </div>
        <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-white md:text-[38px]">
          News &amp; Announcements
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] text-text-dim">
          Roster moves, scrim results, and clan-wide updates — everything GenXio members need
          to stay in the loop.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          {POSTS.map((post, i) => (
            <div key={i} className="card flex flex-col gap-2 sm:flex-row sm:gap-5">
              <div className="font-display min-w-[78px] shrink-0 text-xs font-bold tracking-[0.08em] text-purple">
                {post.date}
              </div>
              <div>
                <span className="tag-chip mb-2.5">{post.tag}</span>
                <h3 className="mb-2 text-base font-semibold text-white">{post.title}</h3>
                <p className="text-[13px] leading-[1.7] text-text-dim">{post.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 card text-xs text-text-dim">
          This page currently shows placeholder posts. Edit the <code>POSTS</code> array in{" "}
          <code>app/news/page.tsx</code> with your real announcements — add more objects to the
          list to add more posts.
        </div>
      </div>
    </>
  );
}
