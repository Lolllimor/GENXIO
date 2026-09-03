"use client";

import { useEffect, useState, FormEvent, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MP_OPERATORS, BR_CLASSES, ACTIVITY_LEVELS, CLAN_TEAMS, clanTeamMeta } from "@/lib/gameData";
import type { Member, MemberStatus, Mode, Activity, ClanTeam } from "@/lib/supabase/types";
import Modal from "../Modal";
import { toastSuccess, toastError } from "../toast";

type TeamFilter = ClanTeam | "all" | "unassigned";

const TEAM_RANK: Record<string, number> = Object.fromEntries(CLAN_TEAMS.map((t) => [t.id, t.rank]));

function clanTeamError(message: string) {
  if (!/clan_team/i.test(message)) return message;
  return "Run supabase/add_clan_teams.sql in the Supabase SQL editor, then try again.";
}

const EMPTY_FORM = {
  ign: "",
  status: "ACTIVE" as MemberStatus,
  clan_team: "" as ClanTeam | "",
  mode: "" as Mode | "",
  mp_role: "",
  device: "",
  whatsapp_name: "",
  whatsapp_number: "",
  notes: "",
  activity: "" as Activity | "",
  comps_experience: false,
  scrim_availability: false,
  weapons: "",
  mp_operator: "",
  br_class: "",
  professional_name: "",
  uid: "",
  discord: "",
  country: "",
  device_serial_number: "",
};

const EMPTY_EXIT_FORM = {
  date_joined: "",
  date_exited: new Date().toISOString().slice(0, 10),
  reason_for_exit: "",
};

export default function RosterPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [exitingMember, setExitingMember] = useState<Member | null>(null);
  const [exitForm, setExitForm] = useState(EMPTY_EXIT_FORM);
  const [exitSaving, setExitSaving] = useState(false);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const visibleMembers = useMemo(() => {
    const rank = (m: Member) => TEAM_RANK[m.clan_team ?? ""] ?? 99;
    return [...members]
      .filter((m) => {
        if (teamFilter === "all") return true;
        if (teamFilter === "unassigned") return !m.clan_team;
        return m.clan_team === teamFilter;
      })
      .sort((a, b) => {
        const byTeam = rank(a) - rank(b);
        if (byTeam !== 0) return byTeam;
        return a.ign.localeCompare(b.ign);
      });
  }, [members, teamFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setMembers(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  function startEdit(m: Member) {
    setEditingId(m.id);
    setExitingMember(null);
    setForm({
      ign: m.ign,
      status: m.status,
      clan_team: m.clan_team ?? "",
      mode: m.mode ?? "",
      mp_role: m.mp_role ?? "",
      device: m.device ?? "",
      whatsapp_name: m.whatsapp_name ?? "",
      whatsapp_number: m.whatsapp_number ?? "",
      notes: m.notes ?? "",
      activity: m.activity ?? "",
      comps_experience: m.comps_experience ?? false,
      scrim_availability: m.scrim_availability ?? false,
      weapons: m.weapons ?? "",
      mp_operator: m.mp_operator ?? "",
      br_class: m.br_class ?? "",
      professional_name: m.professional_name ?? "",
      uid: m.uid ?? "",
      discord: m.discord ?? "",
      country: m.country ?? "",
      device_serial_number: m.device_serial_number ?? "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.ign.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      ign: form.ign.trim(),
      status: form.status,
      clan_team: form.clan_team || null,
      mode: form.mode || null,
      mp_role: form.mp_role.trim() || null,
      device: form.device.trim() || null,
      whatsapp_name: form.whatsapp_name.trim() || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      notes: form.notes.trim() || null,
      activity: form.activity || null,
      comps_experience: form.comps_experience,
      scrim_availability: form.scrim_availability,
      weapons: form.weapons.trim() || null,
      mp_operator: form.mp_operator || null,
      br_class: form.br_class || null,
      professional_name: form.professional_name.trim() || null,
      uid: form.uid.trim() || null,
      discord: form.discord.trim() || null,
      country: form.country.trim() || null,
      device_serial_number: form.device_serial_number.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from("members").update(payload).eq("id", editingId)
      : await supabase.from("members").insert(payload);

    setSaving(false);
    if (error) {
      const message = clanTeamError(error.message);
      setError(message);
      toastError(message);
      return;
    }
    toastSuccess(editingId ? "Member updated." : "Member added to roster.");
    resetForm();
    load();
  }

  async function handleTeamChange(id: string, clan_team: ClanTeam | "") {
    const previous = members.find((m) => m.id === id)?.clan_team ?? null;
    const next = clan_team || null;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, clan_team: next } : m)));
    setSavingTeamId(id);
    const { error } = await supabase.from("members").update({ clan_team: next }).eq("id", id);
    setSavingTeamId(null);
    if (error) {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, clan_team: previous } : m)));
      const message = clanTeamError(error.message);
      setError(message);
      toastError(message);
      return;
    }
    const label = clanTeamMeta(next)?.label ?? "Unassigned";
    toastSuccess(`${label} spot saved.`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this member? Consider “Log exit” instead to keep history.")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Member deleted.");
      load();
    }
  }

  function startExit(m: Member) {
    setExitingMember(m);
    setShowForm(false);
    setExitForm({
      date_joined: m.joined_at,
      date_exited: new Date().toISOString().slice(0, 10),
      reason_for_exit: "",
    });
  }

  async function handleExitSubmit(e: FormEvent) {
    e.preventDefault();
    if (!exitingMember) return;
    setExitSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: exitError } = await supabase.from("exits").insert({
      ign: exitingMember.ign,
      role_at_exit: exitingMember.mp_role,
      device: exitingMember.device,
      weapons: exitingMember.weapons,
      date_joined: exitForm.date_joined || null,
      date_exited: exitForm.date_exited,
      reason_for_exit: exitForm.reason_for_exit.trim() || null,
      whatsapp_number: exitingMember.whatsapp_number,
      member_id: exitingMember.id,
      created_by: user?.id ?? null,
    });

    if (exitError) {
      setExitSaving(false);
      setError(exitError.message);
      toastError(exitError.message);
      return;
    }

    const { error: statusError } = await supabase
      .from("members")
      .update({ status: "INACTIVE" })
      .eq("id", exitingMember.id);

    setExitSaving(false);
    if (statusError) {
      setError(statusError.message);
      toastError(statusError.message);
      return;
    }
    toastSuccess("Exit logged.");
    setExitingMember(null);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Roster</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
            Members
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/history" className="btn btn-outline !py-2.5 !text-[11px]">
            Timeline
          </Link>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setExitingMember(null);
              setShowForm(true);
            }}
            className="btn btn-primary !py-2.5 !text-[11px]"
          >
            Add member
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      <Modal
        open={exitingMember !== null}
        onClose={() => setExitingMember(null)}
        title={exitingMember ? `Log exit — ${exitingMember.clan_tag} | ${exitingMember.ign}` : "Log exit"}
        accent="amber"
      >
        <form onSubmit={handleExitSubmit}>
          <p className="mb-3.5 text-xs text-text-dim">
            This records the departure and sets the member to <b className="text-text">INACTIVE</b>{" "}
            (their history is kept, not deleted).
          </p>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Date joined</label>
              <input
                type="date"
                value={exitForm.date_joined}
                onChange={(e) => setExitForm((f) => ({ ...f, date_joined: e.target.value }))}
              />
            </div>
            <div>
              <label>Date exited</label>
              <input
                type="date"
                value={exitForm.date_exited}
                onChange={(e) => setExitForm((f) => ({ ...f, date_exited: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label>Reason for exit</label>
            <input
              value={exitForm.reason_for_exit}
              onChange={(e) => setExitForm((f) => ({ ...f, reason_for_exit: e.target.value }))}
              placeholder="e.g. Inactivity / left voluntarily"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={exitSaving} className="btn btn-primary">
              {exitSaving ? "Saving…" : "Confirm exit"}
            </button>
            <button type="button" onClick={() => setExitingMember(null)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showForm} onClose={resetForm} title={editingId ? "Edit member" : "New member"}>
        <form onSubmit={handleSubmit}>
          <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Identity</div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>IGN *</label>
              <input value={form.ign} onChange={(e) => setForm((f) => ({ ...f, ign: e.target.value }))} required />
            </div>
            <div>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MemberStatus }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mb-3.5">
            <label>Clan team</label>
            <select
              value={form.clan_team}
              onChange={(e) => setForm((f) => ({ ...f, clan_team: e.target.value as ClanTeam | "" }))}
            >
              <option value="">Unassigned</option>
              {CLAN_TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.hint}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>WhatsApp name</label>
              <input value={form.whatsapp_name} onChange={(e) => setForm((f) => ({ ...f, whatsapp_name: e.target.value }))} />
            </div>
            <div>
              <label>WhatsApp number</label>
              <input value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} />
            </div>
          </div>

          <div className="mb-2.5 mt-5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Playstyle</div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-3">
            <div>
              <label>Activity</label>
              <select value={form.activity} onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as Activity }))}>
                <option value="">—</option>
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Mode</label>
              <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as Mode }))}>
                <option value="">—</option>
                <option value="MP">MP</option>
                <option value="BR">BR</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label>Device</label>
              <input value={form.device} onChange={(e) => setForm((f) => ({ ...f, device: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3.5">
            <label>MP Role</label>
            <input value={form.mp_role} onChange={(e) => setForm((f) => ({ ...f, mp_role: e.target.value }))} placeholder="e.g. Slayer, Anchor" />
          </div>
          <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
            <label className="flex items-center gap-2 normal-case tracking-normal">
              <input
                type="checkbox"
                checked={form.comps_experience}
                onChange={(e) => setForm((f) => ({ ...f, comps_experience: e.target.checked }))}
              />
              <span className="text-xs text-text-dim">Comp experience</span>
            </label>
            <label className="flex items-center gap-2 normal-case tracking-normal">
              <input
                type="checkbox"
                checked={form.scrim_availability}
                onChange={(e) => setForm((f) => ({ ...f, scrim_availability: e.target.checked }))}
              />
              <span className="text-xs text-text-dim">Scrim availability</span>
            </label>
          </div>

          <div className="mb-2.5 mt-5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Loadout</div>
          <div className="mb-3.5">
            <label>Weapon(s)</label>
            <input value={form.weapons} onChange={(e) => setForm((f) => ({ ...f, weapons: e.target.value }))} placeholder="e.g. USS9, Type 19" />
          </div>
          <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>MP Operator</label>
              <select value={form.mp_operator} onChange={(e) => setForm((f) => ({ ...f, mp_operator: e.target.value }))}>
                <option value="">—</option>
                {MP_OPERATORS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label>BR Class</label>
              <select value={form.br_class} onChange={(e) => setForm((f) => ({ ...f, br_class: e.target.value }))}>
                <option value="">—</option>
                {BR_CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2.5 mt-5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
            Official registration (optional)
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Professional name</label>
              <input value={form.professional_name} onChange={(e) => setForm((f) => ({ ...f, professional_name: e.target.value }))} />
            </div>
            <div>
              <label>UID</label>
              <input value={form.uid} onChange={(e) => setForm((f) => ({ ...f, uid: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
            <div>
              <label>Discord</label>
              <input value={form.discord} onChange={(e) => setForm((f) => ({ ...f, discord: e.target.value }))} />
            </div>
            <div>
              <label>Country</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div className="mb-4">
            <label>Device serial number</label>
            <input value={form.device_serial_number} onChange={(e) => setForm((f) => ({ ...f, device_serial_number: e.target.value }))} />
          </div>

          <div className="mb-4">
            <label>Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : editingId ? "Save changes" : "Add to roster"}
          </button>
        </form>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-dim">Loading roster…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-text-dim">No members yet — add the first one above.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {([
              { id: "all" as const, label: "All", count: members.length },
              ...CLAN_TEAMS.map((t) => ({
                id: t.id,
                label: t.label,
                count: members.filter((m) => m.clan_team === t.id).length,
              })),
              {
                id: "unassigned" as const,
                label: "Unassigned",
                count: members.filter((m) => !m.clan_team).length,
              },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setTeamFilter(f.id)}
                className={`border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)] ${
                  teamFilter === f.id ? "border-purple bg-purple/10 text-purple" : "border-line text-text-dim"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {visibleMembers.length === 0 && (
            <p className="mb-4 text-sm text-text-dim">No members on this team yet.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-text-dim">
                  <th className="py-2.5 pr-4 font-display">IGN</th>
                  <th className="py-2.5 pr-4 font-display">Team</th>
                  <th className="py-2.5 pr-4 font-display">Status</th>
                  <th className="py-2.5 pr-4 font-display">Mode</th>
                  <th className="py-2.5 pr-4 font-display">Role</th>
                  <th className="py-2.5 pr-4 font-display">WhatsApp</th>
                  <th className="py-2.5 pr-4 font-display"></th>
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((m) => (
                  <tr key={m.id} className="border-b border-line/60">
                    <td className="py-3 pr-4 font-semibold text-text">
                      {m.clan_tag} | {m.ign}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={m.clan_team ?? ""}
                        disabled={savingTeamId === m.id}
                        onChange={(e) => handleTeamChange(m.id, e.target.value as ClanTeam | "")}
                        className="!min-h-0 !w-[148px] !py-1.5 !pr-7 !text-[11px]"
                      >
                        <option value="">Unassigned</option>
                        {CLAN_TEAMS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wide ${
                          m.status === "ACTIVE" ? "text-green" : "text-text-dim"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-text-dim">{m.mode ?? "—"}</td>
                    <td className="py-3 pr-4 text-text-dim">{m.mp_role ?? "—"}</td>
                    <td className="py-3 pr-4 text-text-dim">{m.whatsapp_number ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(m)}
                          className="text-[11px] font-semibold uppercase tracking-wide text-purple hover:brightness-125"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => startExit(m)}
                          className="text-[11px] font-semibold uppercase tracking-wide text-amber hover:brightness-125"
                        >
                          Log exit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-[11px] font-semibold uppercase tracking-wide text-red hover:brightness-125"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
