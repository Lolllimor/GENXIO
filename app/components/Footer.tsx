import Image from "next/image";
import type { OrgSocialLink } from "@/lib/org-socials";

export default function Footer({ socials }: { socials: OrgSocialLink[] }) {
  return (
    <footer className="mt-20 border-t border-line px-5 pb-8 pt-10 md:px-8">
      <div className="hazard-stripe mb-8" />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <span className="hud-frame h-[30px] w-[30px] overflow-hidden bg-black p-[1px] [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]">
            <Image src="/logo.jpg" alt="GenXio logo" width={30} height={30} className="h-full w-full object-cover" />
          </span>
          <div>
            <div className="font-display text-sm font-bold text-text">
              GEN<span className="text-purple">X</span>IO
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-text-dim">
              Play. Evolve. Dominate.
            </div>
          </div>
        </div>
        {socials.length > 0 && (
          <div className="flex gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="border border-line px-3.5 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim transition-colors hover:border-purple hover:text-purple [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="mx-auto mt-6 flex max-w-5xl items-center gap-2 text-[10.5px] tracking-wide text-text-dim">
        <span className="live-dot" />
        © GenXio Esports. Built for the Call of Duty Mobile community.
      </div>
    </footer>
  );
}
