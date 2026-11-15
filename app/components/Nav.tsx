"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News", disabled: true },
  { href: "/achievements", label: "Achievements", disabled: true },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    queueMicrotask(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-[background-color,backdrop-filter,box-shadow] duration-300 ${
        scrolled || open
          ? "border-line/60 bg-bg/80 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.35)] backdrop-blur-xl"
          : "border-transparent bg-gradient-to-b from-black/90 via-black/65 to-black/10"
      }`}
    >
      <div className="hazard-stripe" />
      <div className="flex items-center justify-between px-5 py-3.5 md:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="hud-frame h-[44px] w-[44px] shrink-0 overflow-hidden bg-black p-[2px] drop-shadow-[0_0_10px_rgba(139,92,246,0.55)] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
          <Image src="/logo.jpg" alt="GenXio logo" width={44} height={44} className="h-full w-full object-cover [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]" />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-lg font-bold leading-none tracking-[0.12em] text-text">
            GEN<span className="text-purple">X</span>IO
          </span>
          <span className="live-dot mt-1">Online</span>
        </span>
      </Link>

      <button
        aria-label="Toggle menu"
        className="text-text md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div
        className={`${
          open ? "max-h-[400px]" : "max-h-0"
        } fixed left-0 right-0 top-[76px] flex flex-col items-stretch overflow-hidden border-b border-line bg-bg transition-[max-height] duration-[250ms] md:static md:max-h-none md:flex-row md:items-center md:gap-2.5 md:border-none md:bg-transparent`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:gap-1 md:border md:border-purple/30 md:bg-black/55 md:px-1.5 md:py-1 md:shadow-[0_0_24px_-6px_rgba(139,92,246,0.5)] md:backdrop-blur-md md:[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          const className = `group relative border-b border-line px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] md:border-none md:px-4 md:py-2.5 after:absolute after:inset-x-4 after:bottom-1 after:h-[2px] after:origin-left after:bg-purple after:shadow-[0_0_10px_var(--purple)] after:transition-transform after:duration-300 [text-shadow:0_1px_10px_rgba(0,0,0,1)] ${
            l.disabled
              ? "pointer-events-none cursor-not-allowed text-white/45 after:scale-x-0"
              : active
                ? "text-white after:scale-x-100 md:[text-shadow:0_0_14px_rgba(167,139,250,0.95)]"
                : "text-white/90 after:scale-x-0 hover:text-white hover:after:scale-x-100 md:hover:[text-shadow:0_0_14px_rgba(167,139,250,0.8)]"
          }`;

          if (l.disabled) {
            return (
              <span key={l.href} className={className} aria-disabled="true" title="Coming soon">
                {l.label}
              </span>
            );
          }

          return (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={className}>
              {active ? "// " : ""}
              {l.label}
            </Link>
          );
        })}
        </div>
        <Link
          href="/apply"
          onClick={() => setOpen(false)}
          className="btn btn-primary btn-sheen m-5 !py-2.5 !text-[11px] shadow-[0_0_22px_rgba(139,92,246,0.45)] md:m-0 md:ml-3"
        >
          Apply
        </Link>
      </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[2px] nav-line opacity-90 shadow-[0_0_12px_var(--purple)]" />
    </nav>
  );
}
