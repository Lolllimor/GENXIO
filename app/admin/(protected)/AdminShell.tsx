"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M4 4h7v7H4V4Zm9 0h7v4h-7V4Zm0 7h7v9h-7v-9ZM4 14h7v6H4v-6Z",
  applications: "M4 4h16v10H4V4Zm0 10 4 6h8l4-6",
  roster: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a3 3 0 1 0 0-6M21 20c0-2.8-2-5.1-4.7-5.8",
  scrims: "M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z",
  exits: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  news: "M4 4h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm13 4h3v10a2 2 0 0 1-2 2h-1M8 8h6M8 12h6M8 16h4",
  achievements: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 4h3a2 2 0 0 1-2 4M7 4H4a2 2 0 0 0 2 4",
  results: "M4 20V10M11 20V4M18 20v-7M3 20h18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a7.97 7.97 0 0 0-.3-2.2l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.9-1.1L15 2h-6l-.4 2.7a8 8 0 0 0-1.9 1.1l-2.5-1-2 3.4 2.1 1.6A8 8 0 0 0 4 12c0 .75.1 1.48.3 2.2l-2.1 1.6 2 3.4 2.5-1c.57.46 1.2.83 1.9 1.1L9 22h6l.4-2.7c.7-.27 1.33-.64 1.9-1.1l2.5 1 2-3.4-2.1-1.6c.2-.72.3-1.45.3-2.2Z",
};

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true, icon: ICONS.dashboard },
  { href: "/admin/applications", label: "Applications", icon: ICONS.applications },
  { href: "/admin/roster", label: "Roster", icon: ICONS.roster },
  { href: "/admin/scrims", label: "Scrims", icon: ICONS.scrims },
  { href: "/admin/results", label: "Match Results", icon: ICONS.results },
  { href: "/admin/exits", label: "Exits", icon: ICONS.exits },
  { href: "/admin/news", label: "News", icon: ICONS.news },
  { href: "/admin/achievements", label: "Achievements", icon: ICONS.achievements },
  { href: "/admin/settings", label: "Settings", icon: ICONS.settings },
];

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeLink = LINKS.find((l) => (l.exact ? pathname === l.href : pathname?.startsWith(l.href)));

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-line bg-panel/40 px-5 py-5 md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r md:px-5 md:py-7">
        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="hud-frame h-9 w-9 shrink-0 overflow-hidden bg-black p-[2px] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
              <Image
                src="/logo.jpg"
                alt="GenXio logo"
                width={36}
                height={36}
                className="h-full w-full object-cover [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
              />
            </span>
            <span>
              <div className="font-display text-sm font-bold tracking-wide text-text">
                GEN<span className="text-purple">X</span>IO
              </div>
              <div className="live-dot mt-1">Command console</div>
            </span>
          </Link>
        </div>

        <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap px-3.5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.1em] transition-colors [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] ${
                  active
                    ? "bg-purple/10 text-purple shadow-[inset_2px_0_0_var(--purple)]"
                    : "text-text-dim hover:bg-panel-2 hover:text-text"
                }`}
              >
                <Icon d={l.icon} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <div className="mb-2 truncate text-[11px] text-text-dim">{email}</div>
          <button onClick={handleSignOut} className="btn btn-outline w-full !py-2 !text-[10.5px]">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-between border-b border-line bg-panel/30 px-8 py-4 md:flex">
          <div className="font-display text-[11px] uppercase tracking-[0.16em] text-text-dim">
            Admin <span className="text-purple">/</span> {activeLink?.label ?? ""}
          </div>
          <div className="flex items-center gap-4">
            <span className="live-dot">Live</span>
            <span className="text-[11px] text-text-dim">{email}</span>
          </div>
        </div>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
