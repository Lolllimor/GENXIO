"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home", disabled: false },
  { href: "/news", label: "News", disabled: true },
  { href: "/achievements", label: "Achievements", disabled: true },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="hazard-stripe" />
      <div className="flex items-center justify-between px-5 py-3.5 md:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="hud-frame h-[38px] w-[38px] shrink-0 overflow-hidden bg-black p-[2px] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
          <Image src="/logo.jpg" alt="GenXio logo" width={38} height={38} className="h-full w-full object-cover [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]" />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-base font-bold leading-none tracking-wide text-white">
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
        } fixed left-0 right-0 top-[70px] flex flex-col items-stretch overflow-hidden border-b border-line bg-bg transition-[max-height] duration-[250ms] md:static md:max-h-none md:flex-row md:items-center md:gap-7 md:border-none md:bg-transparent`}
      >
        {LINKS.map((l) => {
          const active = pathname === l.href;

          if (l.disabled) {
            return (
              <span
                key={l.href}
                aria-disabled="true"
                title="Coming soon"
                className="flex items-center gap-2 border-b border-line px-5 py-4 font-display text-xs font-semibold uppercase tracking-[0.12em] text-text-dim/40 md:border-none md:p-0 md:pb-1.5"
              >
                {l.label}
                <span className="rounded-sm border border-line px-1.5 py-[1px] text-[9px] tracking-[0.1em] text-text-dim/60">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`border-b border-line px-5 py-4 font-display text-xs font-semibold uppercase tracking-[0.12em] transition-colors md:border-none md:border-l-0 md:p-0 md:pb-1.5 ${
                active
                  ? "border-l-2 border-l-purple text-purple md:border-b-2 md:border-b-purple md:[text-shadow:0_0_10px_rgba(139,92,246,0.5)]"
                  : "border-l-2 border-l-transparent text-text-dim hover:text-text"
              }`}
            >
              {active ? "// " : ""}
              {l.label}
            </Link>
          );
        })}
        <Link
          href="/apply"
          onClick={() => setOpen(false)}
          className="btn btn-primary m-5 !py-2.5 !text-[11px] md:m-0"
        >
          Apply
        </Link>
      </div>
      </div>
    </nav>
  );
}
