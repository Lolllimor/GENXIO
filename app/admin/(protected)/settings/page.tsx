"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrgSettings } from "@/lib/supabase/types";
import { toastSuccess, toastError } from "../toast";

const EMPTY_FORM = {
  organization_name: "",
  team_name: "",
  team_tag: "",
  manager_discord: "",
  whatsapp_url: "",
  discord_url: "",
  tiktok_url: "",
  tiktok_video_url: "",
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("org_settings")
      .select("*")
      .limit(1)
      .maybeSingle<OrgSettings>();
    if (error) setError(error.message);
    else if (data) {
      setRowId(String(data.id));
      setForm({
        organization_name: data.organization_name ?? "",
        team_name: data.team_name ?? "",
        team_tag: data.team_tag ?? "",
        manager_discord: data.manager_discord ?? "",
        whatsapp_url: data.whatsapp_url ?? "",
        discord_url: data.discord_url ?? "",
        tiktok_url: data.tiktok_url ?? "",
        tiktok_video_url: data.tiktok_video_url ?? "",
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const organization_name = form.organization_name.trim();
    if (!organization_name) {
      setSaving(false);
      setError("Organization name is required.");
      toastError("Organization name is required.");
      return;
    }

    const payload = {
      organization_name,
      team_name: form.team_name.trim(),
      team_tag: form.team_tag.trim(),
      manager_discord: form.manager_discord.trim() || null,
      whatsapp_url: form.whatsapp_url.trim() || null,
      discord_url: form.discord_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      tiktok_video_url: form.tiktok_video_url.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = rowId
      ? await supabase.from("org_settings").update(payload).eq("id", rowId).select("id").maybeSingle()
      : await supabase.from("org_settings").insert(payload).select("id").maybeSingle();

    if (!error && data?.id) setRowId(String(data.id));

    setSaving(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Settings saved.");
      setSaved(true);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2.5">System</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Settings
          </h1>
        </div>
      </div>

      {error && (
        <div className="my-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-text-dim">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="admin-panel">
              <div className="eyebrow mb-4">Org profile</div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label>Organization name</label>
                  <input
                    required
                    value={form.organization_name}
                    onChange={(e) => setForm((f) => ({ ...f, organization_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Team name</label>
                  <input value={form.team_name} onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))} />
                </div>
                <div>
                  <label>Team tag</label>
                  <input value={form.team_tag} onChange={(e) => setForm((f) => ({ ...f, team_tag: e.target.value }))} />
                </div>
                <div>
                  <label>Manager (Discord tag)</label>
                  <input
                    value={form.manager_discord}
                    onChange={(e) => setForm((f) => ({ ...f, manager_discord: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="admin-panel">
              <div className="eyebrow mb-4">Social links</div>
              <div className="grid gap-3.5">
                <div>
                  <label>WhatsApp link</label>
                  <input
                    placeholder="https://chat.whatsapp.com/…"
                    value={form.whatsapp_url}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp_url: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Discord link</label>
                  <input
                    placeholder="https://discord.gg/…"
                    value={form.discord_url}
                    onChange={(e) => setForm((f) => ({ ...f, discord_url: e.target.value }))}
                  />
                </div>
                <div>
                  <label>TikTok link</label>
                  <input
                    placeholder="https://www.tiktok.com/@…"
                    value={form.tiktok_url}
                    onChange={(e) => setForm((f) => ({ ...f, tiktok_url: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="admin-panel">
              <div className="eyebrow mb-4">Homepage TikTok</div>
              <div>
                <label>Video URL</label>
                <input
                  placeholder="https://www.tiktok.com/@handle/video/1234567890"
                  value={form.tiktok_video_url}
                  onChange={(e) => setForm((f) => ({ ...f, tiktok_video_url: e.target.value }))}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
                  Title and caption are pulled from the TikTok video automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <span className="text-[11px] uppercase tracking-wide text-green">Saved</span>}
          </div>
        </form>
      )}
    </div>
  );
}
