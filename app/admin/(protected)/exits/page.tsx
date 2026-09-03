"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Exit, Member } from "@/lib/supabase/types";
import Modal from "../Modal";
import { toastSuccess, toastError } from "../toast";

const EMPTY_FORM = {
  ign: "",
  role_at_exit: "",
  device: "",
  weapons: "",
  date_joined: "",
  date_exited: new Date().toISOString().slice(0, 10),
  reason_for_exit: "",
  whatsapp_number: "",
};

export default function ExitsPage() {
  const [exits, setExits] = useState<Exit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [exitsRes, membersRes] = await Promise.all([
      supabase.from("exits").select("*").order("date_exited", { ascending: false }),
      supabase.from("members").select("*").eq("status", "ACTIVE").order("ign"),
    ]);
    if (exitsRes.error) setError(exitsRes.error.message);
    else setExits(exitsRes.data ?? []);
    if (membersRes.data) setMembers(membersRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const suggestions =
    form.ign.trim().length > 0
      ? members
          .filter((m) => `${m.clan_tag} ${m.ign}`.toLowerCase().includes(form.ign.trim().toLowerCase()))
          .slice(0, 8)
      : members.slice(0, 8);

  function pickMember(m: Member) {
    setSelectedMemberId(m.id);
    setForm((f) => ({
      ...f,
      ign: m.ign,
      role_at_exit: m.mp_role ?? "",
      device: m.device ?? "",
      weapons: m.weapons ?? "",
      whatsapp_number: m.whatsapp_number ?? "",
      date_joined: m.joined_at ?? "",
    }));
    setShowSuggestions(false);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setSelectedMemberId(null);
    setShowForm(false);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.ign.trim()) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("exits").insert({
      ign: form.ign.trim(),
      role_at_exit: form.role_at_exit.trim() || null,
      device: form.device.trim() || null,
      weapons: form.weapons.trim() || null,
      date_joined: form.date_joined || null,
      date_exited: form.date_exited,
      reason_for_exit: form.reason_for_exit.trim() || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      member_id: selectedMemberId,
      created_by: user?.id ?? null,
    });

    if (error) {
      setSaving(false);
      setError(error.message);
      toastError(error.message);
      return;
    }

    if (selectedMemberId) {
      await supabase.from("members").update({ status: "INACTIVE" }).eq("id", selectedMemberId);
    }

    setSaving(false);
    toastSuccess("Exit logged.");
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this exit record?")) return;
    const { error } = await supabase.from("exits").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Exit record deleted.");
      load();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Departures</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Exits
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary !py-2.5 !text-[11px]"
        >
          Log exit
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <Modal open={showForm} onClose={resetForm} title="New exit record" accent="amber">
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div className="relative">
              <label>IGN *</label>
              <input
                value={form.ign}
                onChange={(e) => {
                  setSelectedMemberId(null);
                  setForm((f) => ({ ...f, ign: e.target.value }));
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Search active roster…"
                autoComplete="off"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full border border-line bg-panel-2 shadow-lg">
                  {suggestions.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onMouseDown={() => pickMember(m)}
                      className="block w-full px-3 py-2 text-left text-[13px] text-text hover:bg-purple/10 hover:text-purple"
                    >
                      {m.clan_tag} | {m.ign}
                    </button>
                  ))}
                </div>
              )}
              {selectedMemberId && (
                <div className="mt-1.5 text-[11px] text-green">
                  Linked to roster — will be set INACTIVE on save
                </div>
              )}
              {!selectedMemberId && form.ign.trim() && (
                <div className="mt-1.5 text-[11px] text-text-dim">
                  No roster match — logging as a manual entry
                </div>
              )}
            </div>
            <div>
              <label>Role at exit</label>
              <input value={form.role_at_exit} onChange={(e) => setForm((f) => ({ ...f, role_at_exit: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Device</label>
              <input value={form.device} onChange={(e) => setForm((f) => ({ ...f, device: e.target.value }))} />
            </div>
            <div>
              <label>Weapon(s)</label>
              <input value={form.weapons} onChange={(e) => setForm((f) => ({ ...f, weapons: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Date joined</label>
              <input type="date" value={form.date_joined} onChange={(e) => setForm((f) => ({ ...f, date_joined: e.target.value }))} />
            </div>
            <div>
              <label>Date exited</label>
              <input type="date" value={form.date_exited} onChange={(e) => setForm((f) => ({ ...f, date_exited: e.target.value }))} required />
            </div>
          </div>
          <div className="mb-3.5">
            <label>Reason for exit</label>
            <input value={form.reason_for_exit} onChange={(e) => setForm((f) => ({ ...f, reason_for_exit: e.target.value }))} placeholder="e.g. Inactivity / left voluntarily" />
          </div>
          <div className="mb-4">
            <label>WhatsApp number</label>
            <input value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Log exit"}
          </button>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading…</p>
      ) : exits.length === 0 ? (
        <p className="text-sm text-text-dim">No departures logged.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-text-dim">
                <th className="py-2.5 pr-4 font-display">IGN</th>
                <th className="py-2.5 pr-4 font-display">Role</th>
                <th className="py-2.5 pr-4 font-display">Joined</th>
                <th className="py-2.5 pr-4 font-display">Exited</th>
                <th className="py-2.5 pr-4 font-display">Reason</th>
                <th className="py-2.5 pr-4 font-display"></th>
              </tr>
            </thead>
            <tbody>
              {exits.map((x) => (
                <tr key={x.id} className="border-b border-line/60">
                  <td className="py-3 pr-4 font-semibold text-text">{x.ign}</td>
                  <td className="py-3 pr-4 text-text-dim">{x.role_at_exit ?? "—"}</td>
                  <td className="py-3 pr-4 text-text-dim">
                    {x.date_joined ? new Date(x.date_joined + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="py-3 pr-4 text-text-dim">
                    {new Date(x.date_exited + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3 pr-4 text-text-dim">{x.reason_for_exit ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleDelete(x.id)}
                      className="text-[11px] font-semibold uppercase tracking-wide text-red hover:brightness-125"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
