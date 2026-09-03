"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel admin-login-panel w-full">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.18em] text-purple">
            // Authenticate
          </div>
          <div className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-text">
            Operator sign-in
          </div>
        </div>
        <span className="live-dot shrink-0">Secure</span>
      </div>

      <div className="mb-3.5">
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@genxio.gg"
          required
          autoFocus
          autoComplete="email"
        />
      </div>
      <div className="mb-5">
        <label htmlFor="admin-password">Password</label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="!pr-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-dim transition-colors hover:text-purple"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary w-full">
        {submitting ? "Authenticating…" : "Enter command"}
      </button>

      {error && (
        <div className="mt-3.5 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-text-dim">
        Session is checked against the admin allowlist.
      </p>
    </form>
  );
}
