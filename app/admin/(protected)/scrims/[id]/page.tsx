"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceStatus, Member, Scrim, ScrimTeam, TeamSlot } from "@/lib/supabase/types";

type SelectableStatus = Exclude<AttendanceStatus, "absent">;

const SELECTABLE_STATUSES: SelectableStatus[] = ["present", "late", "excused"];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "border-green bg-green/10 text-green",
  late: "border-amber bg-amber/10 text-amber",
  excused: "border-purple bg-purple/10 text-purple",
  absent: "border-red bg-red/10 text-red",
};

const SLOT_CAP: Record<TeamSlot, number> = { main: 4, sub: 2 };

interface Assignment {
  teamId: string;
  slot: TeamSlot;
  status: SelectableStatus;
}

export default function ScrimAttendancePage() {
  const params = useParams<{ id: string }>();
  const scrimId = params.id;

  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<ScrimTeam[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [scrimRes, membersRes, teamsRes, attendanceRes] = await Promise.all([
      supabase.from("scrims").select("*").eq("id", scrimId).single(),
      supabase.from("members").select("*").eq("status", "ACTIVE").order("ign"),
      supabase.from("scrim_teams").select("*").eq("scrim_id", scrimId).order("sort_order"),
      supabase.from("scrim_attendance").select("member_id, status, team_id, slot").eq("scrim_id", scrimId),
    ]);

    if (scrimRes.error) setError(scrimRes.error.message);
    else setScrim(scrimRes.data);

    if (membersRes.error) setError(membersRes.error.message);
    else setMembers(membersRes.data ?? []);

    if (teamsRes.error) setError(teamsRes.error.message);
    else setTeams(teamsRes.data ?? []);

    if (attendanceRes.data) {
      const map: Record<string, Assignment> = {};
      for (const row of attendanceRes.data) {
        if (row.status !== "absent" && row.team_id && row.slot) {
          map[row.member_id] = { teamId: row.team_id, slot: row.slot as TeamSlot, status: row.status as SelectableStatus };
        }
      }
      setAssignments(map);
    }

    setLoading(false);
  }, [supabase, scrimId]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  async function handleAddTeam() {
    setAddingTeam(true);
    const { data, error } = await supabase
      .from("scrim_teams")
      .insert({ scrim_id: scrimId, name: `Team ${teams.length + 1}`, sort_order: teams.length })
      .select("*")
      .single();
    setAddingTeam(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTeams((prev) => [...prev, data]);
  }

  async function handleRenameTeam(teamId: string, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
    await supabase.from("scrim_teams").update({ name }).eq("id", teamId);
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm("Delete this team? Assigned members will become unselected.")) return;
    const { error } = await supabase.from("scrim_teams").delete().eq("id", teamId);
    if (error) {
      setError(error.message);
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setAssignments((prev) => {
      const next = { ...prev };
      for (const [memberId, a] of Object.entries(next)) {
        if (a.teamId === teamId) delete next[memberId];
      }
      return next;
    });
    setSaved(false);
  }

  function assign(memberId: string, teamId: string, slot: TeamSlot) {
    setAssignments((prev) => ({ ...prev, [memberId]: { teamId, slot, status: "present" } }));
    setSaved(false);
  }

  function unassign(memberId: string) {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
    setSaved(false);
  }

  function setAssignmentStatus(memberId: string, status: SelectableStatus) {
    setAssignments((prev) => {
      const current = prev[memberId];
      if (!current) return prev;
      return { ...prev, [memberId]: { ...current, status } };
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const rows = members.map((m) => {
      const a = assignments[m.id];
      return {
        scrim_id: scrimId,
        member_id: m.id,
        status: a ? a.status : "absent",
        team_id: a ? a.teamId : null,
        slot: a ? a.slot : null,
      };
    });

    const { error } = await supabase
      .from("scrim_attendance")
      .upsert(rows, { onConflict: "scrim_id,member_id" });

    setSaving(false);
    if (error) setError(error.message);
    else setSaved(true);
  }

  const assignedMemberIds = new Set(Object.keys(assignments));
  const unassignedMembers = members.filter((m) => !assignedMemberIds.has(m.id));

  return (
    <div>
      <Link href="/admin/scrims" className="mb-4 inline-block text-[11px] uppercase tracking-wide text-text-dim hover:text-purple">
        ← Back to scrims
      </Link>

      <div className="eyebrow mb-2.5">Attendance</div>
      {scrim && (
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">
          {scrim.opponent || "Internal scrim"} —{" "}
          {new Date(scrim.scrim_date + "T00:00:00").toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </h1>
      )}

      {error && (
        <div className="my-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-text-dim">Loading roster…</p>
      ) : members.length === 0 ? (
        <p className="mt-6 text-sm text-text-dim">No active members on the roster yet.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-5">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                members={members}
                assignments={assignments}
                onAssign={assign}
                onUnassign={unassign}
                onStatusChange={setAssignmentStatus}
                onRename={handleRenameTeam}
                onDelete={handleDeleteTeam}
              />
            ))}
          </div>

          <button onClick={handleAddTeam} disabled={addingTeam} className="btn btn-outline mt-5 !py-2.5 !text-[11px]">
            {addingTeam ? "Adding…" : "+ Add team"}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Save attendance"}
            </button>
            {saved && <span className="text-[11px] uppercase tracking-wide text-green">Saved</span>}
          </div>

          {unassignedMembers.length > 0 && (
            <div className="mt-8">
              <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
                Not on a team — marked absent by default ({unassignedMembers.length})
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-dim">
                {unassignedMembers.map((m) => (
                  <span key={m.id}>
                    {m.clan_tag} | {m.ign}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamCard({
  team,
  members,
  assignments,
  onAssign,
  onUnassign,
  onStatusChange,
  onRename,
  onDelete,
}: {
  team: ScrimTeam;
  members: Member[];
  assignments: Record<string, Assignment>;
  onAssign: (memberId: string, teamId: string, slot: TeamSlot) => void;
  onUnassign: (memberId: string) => void;
  onStatusChange: (memberId: string, status: SelectableStatus) => void;
  onRename: (teamId: string, name: string) => void;
  onDelete: (teamId: string) => void;
}) {
  const [name, setName] = useState(team.name);
  const assignedIds = new Set(Object.keys(assignments));

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== team.name && onRename(team.id, name.trim())}
          className="!min-h-0 max-w-[220px] !border-none !bg-transparent !p-0 font-display text-[13px] font-bold uppercase tracking-wide text-purple focus:!shadow-none"
        />
        <button
          type="button"
          onClick={() => onDelete(team.id)}
          className="text-[11px] font-semibold uppercase tracking-wide text-red hover:brightness-125"
        >
          Delete team
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SlotGroup
          label="Main"
          slot="main"
          team={team}
          members={members}
          assignments={assignments}
          assignedIds={assignedIds}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onStatusChange={onStatusChange}
        />
        <SlotGroup
          label="Subs"
          slot="sub"
          team={team}
          members={members}
          assignments={assignments}
          assignedIds={assignedIds}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

function SlotGroup({
  label,
  slot,
  team,
  members,
  assignments,
  assignedIds,
  onAssign,
  onUnassign,
  onStatusChange,
}: {
  label: string;
  slot: TeamSlot;
  team: ScrimTeam;
  members: Member[];
  assignments: Record<string, Assignment>;
  assignedIds: Set<string>;
  onAssign: (memberId: string, teamId: string, slot: TeamSlot) => void;
  onUnassign: (memberId: string) => void;
  onStatusChange: (memberId: string, status: SelectableStatus) => void;
}) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const slotMembers = members.filter(
    (m) => assignments[m.id]?.teamId === team.id && assignments[m.id]?.slot === slot
  );
  const cap = SLOT_CAP[slot];
  const isFull = slotMembers.length >= cap;

  const candidates = members.filter((m) => !assignedIds.has(m.id));
  const suggestions =
    query.trim().length > 0
      ? candidates.filter((m) => `${m.clan_tag} ${m.ign}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
      : candidates.slice(0, 6);

  return (
    <div>
      <div className="mb-2 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
        {label} ({slotMembers.length}/{cap})
      </div>

      <div className="flex flex-col gap-2">
        {slotMembers.map((m) => {
          const a = assignments[m.id];
          return (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border border-line bg-panel-2 px-2.5 py-2">
              <span className="text-[12.5px] font-semibold text-text">
                {m.clan_tag} | {m.ign}
              </span>
              <div className="flex items-center gap-1">
                {SELECTABLE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(m.id, s)}
                    className={`border px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors ${
                      a?.status === s ? STATUS_STYLE[s] : "border-line text-text-dim hover:text-text"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onUnassign(m.id)}
                  aria-label={`Remove ${m.ign}`}
                  className="ml-0.5 text-text-dim hover:text-red"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="4" x2="20" y2="20" />
                    <line x1="20" y1="4" x2="4" y2="20" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isFull && (
        <div className="relative mt-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            placeholder={`Add ${label.toLowerCase()}…`}
            autoComplete="off"
            className="!min-h-0 !py-1.5 !text-[12px]"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full border border-line bg-panel-2 shadow-lg">
              {suggestions.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onMouseDown={() => {
                    onAssign(m.id, team.id, slot);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-2 text-left text-[12.5px] text-text hover:bg-purple/10 hover:text-purple"
                >
                  {m.clan_tag} | {m.ign}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
