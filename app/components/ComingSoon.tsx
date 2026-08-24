import Link from "next/link";

export default function ComingSoon({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center md:py-32">
      <div className="hud-frame relative mb-6 flex h-16 w-16 items-center justify-center border border-line text-purple">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="4" y="10" width="16" height="10" rx="1" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>

      <div className="eyebrow mb-2.5 justify-center">{eyebrow}</div>
      <h1 className="font-display text-[26px] font-bold uppercase tracking-tight text-white md:text-[34px]">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-text-dim">{desc}</p>

      <div className="mt-5 rank-badge">Module locked</div>

      <Link href="/" className="btn btn-outline mt-8">
        Back to base
      </Link>
    </div>
  );
}
