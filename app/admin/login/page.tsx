import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="admin-login relative flex min-h-screen flex-col overflow-hidden">
      <div className="hazard-stripe shrink-0" />
      <div
        className="pointer-events-none absolute right-[-120px] top-1/2 h-[420px] w-[420px] -translate-y-1/2 bg-contain bg-center bg-no-repeat grayscale md:right-[-80px] md:h-[640px] md:w-[640px]"
        style={{ backgroundImage: "url(/logo.jpg)", opacity: "var(--decoration-opacity)" }}
      />
      <div className="light-shaft -left-1/3 top-[18%]" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="hud-frame h-10 w-10 shrink-0 overflow-hidden bg-black p-[2px] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
            <Image
              src="/logo.jpg"
              alt="GenXio logo"
              width={40}
              height={40}
              className="h-full w-full object-cover [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]"
            />
          </span>
          <span>
            <div className="font-display text-[15px] font-bold tracking-wide text-text">
              GEN<span className="text-purple">X</span>IO
            </div>
            <div className="live-dot mt-1">Command</div>
          </span>
        </Link>
        <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-dim transition-colors hover:text-purple">
          ← Public site
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-10 px-5 py-8 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-6">
        <div>
          <div className="eyebrow mb-4">Restricted channel</div>
          <h1 className="font-display max-w-xl text-[36px] font-bold uppercase leading-[0.98] tracking-tight text-text md:text-[52px]">
            Command <span className="text-purple [text-shadow:0_0_28px_rgba(139,92,246,0.55)]">access</span>
          </h1>
          <p className="mt-4 max-w-md text-[13.5px] leading-[1.75] text-text-dim">
            Sign in to manage roster, applications, news, and clan settings. This gate is for GenXio operators only.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <span className="admin-chip admin-chip-active">Encrypted</span>
            <span className="admin-chip">Admin roster</span>
            <span className="admin-chip">Live ops</span>
          </div>
        </div>

        <div className="admin-login-stage hud-frame p-3 md:p-4">
          <Suspense
            fallback={
              <div className="admin-panel flex min-h-[280px] items-center justify-center text-sm text-text-dim">
                Loading…
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex items-center justify-between gap-4 border-t border-line px-5 py-4 text-[10.5px] uppercase tracking-[0.14em] text-text-dim md:px-10">
        <span>GenXio Esports // Authorized personnel</span>
        <span className="hidden sm:inline">Call of Duty Mobile</span>
      </footer>
    </div>
  );
}
