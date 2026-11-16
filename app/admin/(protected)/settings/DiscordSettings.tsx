"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NOTIFY_APPLICATIONS_KEY, WEBHOOK_KEY, isDiscordWebhook, sendDiscord } from "@/lib/discord";
import { toastError, toastSuccess } from "../toast";

export default function DiscordSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState("");
  const [notify, setNotify] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [missingTable, setMissingTable] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("admin_settings").select("key, value").in("key", [WEBHOOK_KEY, NOTIFY_APPLICATIONS_KEY]);
    if (error) {
      setMissingTable(/admin_settings/i.test(error.message));
    } else {
      const map = new Map((data ?? []).map((r) => [r.key as string, r.value as string | null]));
      setUrl(map.get(WEBHOOK_KEY) ?? "");
      setNotify((map.get(NOTIFY_APPLICATIONS_KEY) ?? "true") !== "false");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function save() {
    const trimmed = url.trim();
    if (trimmed && !isDiscordWebhook(trimmed)) {
      toastError("That doesn't look like a Discord webhook URL (it should start with https://discord.com/api/webhooks/).");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("admin_settings").upsert([
      { key: WEBHOOK_KEY, value: trimmed || null, updated_at: new Date().toISOString() },
      { key: NOTIFY_APPLICATIONS_KEY, value: notify ? "true" : "false", updated_at: new Date().toISOString() },
    ]);
    setBusy(false);
    if (error) {
      toastError(/admin_settings/i.test(error.message) ? "Run supabase/add_discord_alerts.sql in the Supabase SQL editor first." : error.message);
      return;
    }
    toastSuccess("Discord settings saved.");
  }

  async function test() {
    const trimmed = url.trim();
    if (!isDiscordWebhook(trimmed)) {
      toastError("Paste a valid Discord webhook URL first.");
      return;
    }
    setBusy(true);
    const err = await sendDiscord(trimmed, { embeds: [{ title: "✅ Discord alerts connected", description: "GenXio admin can now post here.", color: 0x8b5cf6 }] });
    setBusy(false);
    if (err) toastError(err);
    else toastSuccess("Test message sent — check your Discord channel.");
  }

  return (
    <div className="admin-panel mt-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.16em] text-purple">Discord alerts</h2>
      </div>
      <p className="mb-4 max-w-2xl text-[12.5px] leading-relaxed text-text-dim">
        Get a Discord message whenever someone applies, and post tournament results or scrim registrations with one click. In Discord: <b className="text-text">Channel settings → Integrations → Webhooks → New Webhook → Copy URL</b>.
      </p>

      {missingTable && (
        <div className="mb-4 rounded-sm border border-amber bg-amber/10 px-3.5 py-3 text-[12.5px] text-amber">
          Run <code>supabase/add_discord_alerts.sql</code> in the Supabase SQL editor, then reload this page.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">Loading…</p>
      ) : (
        <>
          <label>Webhook URL</label>
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/…"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="btn btn-outline shrink-0 !px-3 !py-2 !text-[10px]">
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-text-dim">Keep this private — anyone with the URL can post to your channel. It&apos;s stored where only admins can read it.</p>

          <label className="mt-4 flex items-center gap-2.5 !normal-case">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="admin-check" />
            <span className="text-[12px] text-text">Post a message when a new application is submitted</span>
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={save} disabled={busy} className="btn btn-primary !py-2.5 !text-[11px]">
              {busy ? "Working…" : "Save Discord settings"}
            </button>
            <button type="button" onClick={test} disabled={busy} className="btn btn-outline !py-2.5 !text-[11px]">
              Send test message
            </button>
          </div>
        </>
      )}
    </div>
  );
}
