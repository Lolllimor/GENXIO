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
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("org_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle<OrgSettings>();
    if (error) setError(error.message);
    else if (data) {
      setForm({
        organization_name: data.organization_name ?? "",
        team_name: data.team_name ?? "",
        team_tag: data.team_tag ?? "",
        manager_discord: data.manager_discord ?? "",
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

    const { error } = await supabase
      .from("org_settings")
      .update({
        organization_name: form.organization_name.trim() || null,
        team_name: form.team_name.trim() || null,
        team_tag: form.team_tag.trim() || null,
        manager_discord: form.manager_discord.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);

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
      <div className="eyebrow mb-2.5">Org profile</div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
        Settings
      </h1>

      {error && (
        <div className="my-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-text-dim">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="card mt-6 max-w-lg">
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Organization name</label>
              <input
                value={form.organization_name}
                onChange={(e) => setForm((f) => ({ ...f, organization_name: e.target.value }))}
              />
            </div>
            <div>
              <label>Team name</label>
              <input value={form.team_name} onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))} />
            </div>
          </div>
          <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
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
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="ml-3 text-[11px] uppercase tracking-wide text-green">Saved</span>}
        </form>
      )}
    </div>
  );
}
