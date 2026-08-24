export default function AdminSetupPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 md:py-32">
      <div className="hud-frame relative mb-6 flex h-16 w-16 items-center justify-center border border-line text-amber">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>

      <div className="eyebrow mb-2.5">Command center</div>
      <h1 className="font-display text-[26px] font-bold uppercase tracking-tight text-text md:text-[34px]">
        Supabase not configured
      </h1>
      <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-text-dim">
        The admin panel needs a Supabase project before it can log members, scrim attendance,
        news, or achievements. Wire it up:
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        <li className="card">
          <div className="font-display mb-1.5 text-[13px] font-bold tracking-wide text-purple">01</div>
          <p className="text-[13px] leading-relaxed text-text-dim">
            Create a free project at{" "}
            <span className="text-text">supabase.com</span>, then open{" "}
            <span className="text-text">Project Settings → API</span> to grab the project URL
            and the <span className="text-text">anon public</span> key.
          </p>
        </li>
        <li className="card">
          <div className="font-display mb-1.5 text-[13px] font-bold tracking-wide text-purple">02</div>
          <p className="text-[13px] leading-relaxed text-text-dim">
            Copy <code className="text-text">.env.local.example</code> to{" "}
            <code className="text-text">.env.local</code> and fill in{" "}
            <code className="text-text">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Restart the dev
            server.
          </p>
        </li>
        <li className="card">
          <div className="font-display mb-1.5 text-[13px] font-bold tracking-wide text-purple">03</div>
          <p className="text-[13px] leading-relaxed text-text-dim">
            In the Supabase SQL editor, run <code className="text-text">supabase/schema.sql</code>{" "}
            from this repo to create the tables and access rules.
          </p>
        </li>
        <li className="card">
          <div className="font-display mb-1.5 text-[13px] font-bold tracking-wide text-purple">04</div>
          <p className="text-[13px] leading-relaxed text-text-dim">
            In <span className="text-text">Authentication → Users</span>, add yourself with an
            email + password, copy the new user&apos;s UID, then run in the SQL editor:
            <br />
            <code className="mt-1.5 block text-[11px] text-amber">
              insert into public.admins (id, email) values (&apos;&lt;uid&gt;&apos;,
              &apos;&lt;email&gt;&apos;);
            </code>
          </p>
        </li>
      </ol>

      <p className="mt-6 text-[12px] text-text-dim">
        Once that&apos;s done, reload <code className="text-text">/admin/login</code> to sign in.
      </p>
    </div>
  );
}
