"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CLAN_TEAMS, CLAN_TEAM_STYLE, clanTeamMeta } from "@/lib/gameData";
import type { AttendanceStatus, ClanTeam, Member, MatchResult, MatchResultKill, Scrim, ScrimTeam, TeamSlot } from "@/lib/supabase/types";
import { toastSuccess, toastError } from "../../toast";

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

interface LobbyState {
  id: string | null;
  position: string;
  notes: string;
  kills: Record<string, string>;
}

function emptyLobby(): LobbyState {
  return { id: null, position: "", notes: "", kills: {} };
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
  const [seeding, setSeeding] = useState(false);

  const [lobbies, setLobbies] = useState<LobbyState[]>([emptyLobby()]);
  const [removedResultIds, setRemovedResultIds] = useState<string[]>([]);
  const [resultsSaving, setResultsSaving] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [scrimRes, membersRes, teamsRes, attendanceRes, resultsRes] = await Promise.all([
      supabase.from("scrims").select("*").eq("id", scrimId).single(),
      supabase.from("members").select("*").eq("status", "ACTIVE").order("ign"),
      supabase.from("scrim_teams").select("*").eq("scrim_id", scrimId).order("sort_order"),
      supabase.from("scrim_attendance").select("member_id, status, team_id, slot").eq("scrim_id", scrimId),
      supabase.from("match_results").select("*").eq("scrim_id", scrimId).order("lobby_number"),
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

    const results = (resultsRes.data as MatchResult[]) ?? [];
    if (results.length > 0) {
      const resultIds = results.map((r) => r.id);
      const killsRes = await supabase.from("match_result_kills").select("*").in("match_result_id", resultIds);
      const killsByResult: Record<string, MatchResultKill[]> = {};
      for (const k of (killsRes.data as MatchResultKill[]) ?? []) {
        (killsByResult[k.match_result_id] ??= []).push(k);
      }
      const maxLobby = Math.max(...results.map((r) => r.lobby_number));
      const nextLobbies: LobbyState[] = Array.from({ length: maxLobby }, () => emptyLobby());
      for (const r of results) {
        const kills: Record<string, string> = {};
        for (const k of killsByResult[r.id] ?? []) kills[k.member_id] = String(k.kills);
        nextLobbies[r.lobby_number - 1] = {
          id: r.id,
          position: String(r.position),
          notes: r.notes ?? "",
          kills,
        };
      }
      setLobbies(nextLobbies);
    } else {
      setLobbies([emptyLobby()]);
    }
    setRemovedResultIds([]);

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
      toastError(error.message);
      return;
    }
    toastSuccess("Team added.");
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
      toastError(error.message);
      return;
    }
    toastSuccess("Team deleted.");
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

  async function persistAttendance(nextAssignments: Record<string, Assignment>, roster: Member[]) {
    const rows = roster.map((m) => {
      const a = nextAssignments[m.id];
      return {
        scrim_id: scrimId,
        member_id: m.id,
        status: a ? a.status : "absent",
        team_id: a ? a.teamId : null,
        slot: a ? a.slot : null,
      };
    });
    return supabase.from("scrim_attendance").upsert(rows, { onConflict: "scrim_id,member_id" });
  }

  async function fillFromClanTeams() {
    setSeeding(true);
    setError(null);

    const byName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));
    const teamForClan: Record<string, ScrimTeam> = {};
    const created: ScrimTeam[] = [];

    for (const clan of CLAN_TEAMS) {
      const existing = byName.get(clan.label.toLowerCase());
      if (existing) {
        teamForClan[clan.id] = existing;
        continue;
      }
      const { data, error } = await supabase
        .from("scrim_teams")
        .insert({ scrim_id: scrimId, name: clan.label, sort_order: clan.rank - 1 })
        .select("*")
        .single();
      if (error || !data) {
        setSeeding(false);
        const message = error?.message ?? "Could not create clan teams.";
        setError(message);
        toastError(message);
        return;
      }
      teamForClan[clan.id] = data;
      created.push(data);
    }

    const nextTeams = [...teams, ...created].sort((a, b) => a.sort_order - b.sort_order);
    const nextAssignments: Record<string, Assignment> = { ...assignments };

    for (const clan of CLAN_TEAMS) {
      const team = teamForClan[clan.id];
      let mains = Object.values(nextAssignments).filter((a) => a.teamId === team.id && a.slot === "main").length;
      let subs = Object.values(nextAssignments).filter((a) => a.teamId === team.id && a.slot === "sub").length;
      const pool = members.filter((m) => m.clan_team === clan.id && !nextAssignments[m.id]);
      for (const m of pool) {
        if (mains < SLOT_CAP.main) {
          nextAssignments[m.id] = { teamId: team.id, slot: "main", status: "present" };
          mains += 1;
        } else if (subs < SLOT_CAP.sub) {
          nextAssignments[m.id] = { teamId: team.id, slot: "sub", status: "present" };
          subs += 1;
        }
      }
    }

    const { error } = await persistAttendance(nextAssignments, members);
    setSeeding(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
      return;
    }
    setTeams(nextTeams);
    setAssignments(nextAssignments);
    setSaved(true);
    toastSuccess("Lineup filled from clan teams.");
  }

  async function copyLastLineup() {
    if (teams.length > 0) {
      toastError("This scrim already has teams. Delete them first if you want to copy the last lineup.");
      return;
    }
    setSeeding(true);
    setError(null);

    const { data: previous, error: prevError } = await supabase
      .from("scrims")
      .select("id")
      .neq("id", scrimId)
      .order("scrim_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevError || !previous) {
      setSeeding(false);
      const message = prevError?.message ?? "No previous scrim to copy.";
      toastError(message);
      return;
    }

    const [teamsRes, attRes] = await Promise.all([
      supabase.from("scrim_teams").select("*").eq("scrim_id", previous.id).order("sort_order"),
      supabase.from("scrim_attendance").select("member_id, status, team_id, slot").eq("scrim_id", previous.id),
    ]);

    if (teamsRes.error) {
      setSeeding(false);
      setError(teamsRes.error.message);
      toastError(teamsRes.error.message);
      return;
    }

    const sourceTeams = teamsRes.data ?? [];
    if (sourceTeams.length === 0) {
      setSeeding(false);
      toastError("The last scrim has no teams to copy.");
      return;
    }

    const activeIds = new Set(members.map((m) => m.id));
    const idMap: Record<string, string> = {};
    const created: ScrimTeam[] = [];

    for (const source of sourceTeams) {
      const { data, error } = await supabase
        .from("scrim_teams")
        .insert({ scrim_id: scrimId, name: source.name, sort_order: source.sort_order })
        .select("*")
        .single();
      if (error || !data) {
        setSeeding(false);
        const message = error?.message ?? "Could not copy teams.";
        setError(message);
        toastError(message);
        return;
      }
      idMap[source.id] = data.id;
      created.push(data);
    }

    const nextAssignments: Record<string, Assignment> = { ...assignments };
    for (const row of attRes.data ?? []) {
      if (row.status === "absent" || !row.team_id || !row.slot || !activeIds.has(row.member_id)) continue;
      const teamId = idMap[row.team_id];
      if (!teamId) continue;
      nextAssignments[row.member_id] = {
        teamId,
        slot: row.slot as TeamSlot,
        status: row.status as SelectableStatus,
      };
    }

    const { error } = await persistAttendance(nextAssignments, members);
    setSeeding(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
      return;
    }
    setTeams((prev) => [...prev, ...created].sort((a, b) => a.sort_order - b.sort_order));
    setAssignments(nextAssignments);
    setSaved(true);
    toastSuccess("Copied the last scrim lineup.");
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { error } = await persistAttendance(assignments, members);

    setSaving(false);
    if (error) {
      setError(error.message);
      toastError(error.message);
    } else {
      toastSuccess("Attendance saved.");
      setSaved(true);
    }
  }

  const assignedMemberIds = new Set(Object.keys(assignments));
  const unassignedMembers = members.filter((m) => !assignedMemberIds.has(m.id));
  const rosteredMembers = members.filter((m) => assignedMemberIds.has(m.id));

  function setLobbyCount(count: number) {
    const clamped = Math.max(1, Math.min(count, 20));
    setLobbies((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, () => emptyLobby())];
      }
      const removed = prev.slice(clamped).filter((l) => l.id);
      if (removed.length > 0) {
        setRemovedResultIds((ids) => [...ids, ...removed.map((l) => l.id as string)]);
      }
      return prev.slice(0, clamped);
    });
    setResultsSaved(false);
  }

  function updateLobby(index: number, patch: Partial<LobbyState>) {
    setLobbies((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    setResultsSaved(false);
  }

  function updateKill(index: number, memberId: string, value: string) {
    setLobbies((prev) =>
      prev.map((l, i) => (i === index ? { ...l, kills: { ...l.kills, [memberId]: value } } : l))
    );
    setResultsSaved(false);
  }

  async function handleSaveResults() {
    setResultsSaving(true);
    setError(null);

    if (removedResultIds.length > 0) {
      const { error: deleteError } = await supabase.from("match_results").delete().in("id", removedResultIds);
      if (deleteError) {
        setResultsSaving(false);
        setError(deleteError.message);
        toastError(deleteError.message);
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    for (let i = 0; i < lobbies.length; i++) {
      const lobby = lobbies[i];
      const lobbyNumber = i + 1;
      const position = parseInt(lobby.position, 10);
      const hasPosition = lobby.position.trim() !== "" && position >= 1;

      if (!hasPosition) {
        if (lobby.id) {
          const { error: deleteError } = await supabase.from("match_results").delete().eq("id", lobby.id);
          if (deleteError) {
            setResultsSaving(false);
            setError(deleteError.message);
            toastError(deleteError.message);
            return;
          }
          updateLobby(i, { id: null });
        }
        continue;
      }

      const { data: mr, error: upsertError } = await supabase
        .from("match_results")
        .upsert(
          {
            scrim_id: scrimId,
            lobby_number: lobbyNumber,
            position,
            notes: lobby.notes.trim() || null,
            ...(lobby.id ? {} : { created_by: user?.id ?? null }),
          },
          { onConflict: "scrim_id,lobby_number" }
        )
        .select("id")
        .single();

      if (upsertError || !mr) {
        setResultsSaving(false);
        const message = upsertError?.message ?? "Failed to save lobby result.";
        setError(message);
        toastError(message);
        return;
      }

      if (!lobby.id) updateLobby(i, { id: mr.id });

      const killRows = rosteredMembers.map((m) => ({
        match_result_id: mr.id,
        member_id: m.id,
        kills: parseInt(lobby.kills[m.id] || "0", 10) || 0,
      }));

      if (killRows.length > 0) {
        const { error: killsError } = await supabase
          .from("match_result_kills")
          .upsert(killRows, { onConflict: "match_result_id,member_id" });
        if (killsError) {
          setResultsSaving(false);
          setError(killsError.message);
          toastError(killsError.message);
          return;
        }
      }
    }

    setRemovedResultIds([]);
    setResultsSaving(false);
    setResultsSaved(true);
    toastSuccess("Match results saved.");
    load();
  }

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
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={fillFromClanTeams} disabled={seeding} className="btn btn-primary !py-2.5 !text-[11px]">
              {seeding ? "Seating…" : "Fill from clan teams"}
            </button>
            <button onClick={copyLastLineup} disabled={seeding || teams.length > 0} className="btn btn-outline !py-2.5 !text-[11px]">
              Copy last lineup
            </button>
            <button onClick={handleAddTeam} disabled={addingTeam || seeding} className="btn btn-outline !py-2.5 !text-[11px]">
              {addingTeam ? "Adding…" : "+ Add team"}
            </button>
          </div>

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
                  <span key={m.id} className="inline-flex items-center gap-1.5">
                    {m.clan_tag} | {m.ign}
                    <ClanTeamMark team={m.clan_team} />
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 border-t border-line pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="eyebrow">Match results</div>
              <label className="flex items-center gap-2.5 normal-case tracking-normal">
                <span className="text-[11px] uppercase tracking-wide text-text-dim">Number of lobbies</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={lobbies.length}
                  onChange={(e) => setLobbyCount(parseInt(e.target.value, 10) || 1)}
                  className="!min-h-0 !w-16 !py-1.5 text-center"
                />
              </label>
            </div>

            {rosteredMembers.length === 0 ? (
              <p className="text-sm text-text-dim">Assign players to a team above before logging kills.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {lobbies.map((lobby, i) => {
                  const teamKills = rosteredMembers.reduce(
                    (sum, m) => sum + (parseInt(lobby.kills[m.id] || "0", 10) || 0),
                    0
                  );
                  return (
                    <div key={i} className="admin-panel">
                      <div className="mb-3.5 flex items-center justify-between border-b border-line pb-3">
                        <div className="font-display text-[13px] font-bold uppercase tracking-wide text-purple">
                          Lobby {i + 1}
                        </div>
                        <div className="rank-badge">{teamKills} team kills</div>
                      </div>
                      <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
                        <div>
                          <label>Placement</label>
                          <input
                            type="number"
                            min={1}
                            value={lobby.position}
                            onChange={(e) => updateLobby(i, { position: e.target.value })}
                            placeholder="e.g. 1"
                          />
                        </div>
                        <div>
                          <label>Notes</label>
                          <input
                            value={lobby.notes}
                            onChange={(e) => updateLobby(i, { notes: e.target.value })}
                            placeholder="e.g. Chicken dinner"
                          />
                        </div>
                      </div>
                      <label>Kill base</label>
                      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                        {rosteredMembers.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-2 border border-line bg-panel-2 px-2.5 py-1.5">
                            <span className="truncate text-[12px] text-text">{m.ign}</span>
                            <input
                              type="number"
                              min={0}
                              value={lobby.kills[m.id] ?? ""}
                              onChange={(e) => updateKill(i, m.id, e.target.value)}
                              placeholder="0"
                              className="!min-h-0 !w-16 !py-1 text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button onClick={handleSaveResults} disabled={resultsSaving} className="btn btn-primary">
                {resultsSaving ? "Saving…" : "Save results"}
              </button>
              {resultsSaved && <span className="text-[11px] uppercase tracking-wide text-green">Saved</span>}
            </div>
          </div>
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
    <div className="admin-panel">
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
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
                {m.clan_tag} | {m.ign}
                <ClanTeamMark team={m.clan_team} />
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
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12.5px] text-text hover:bg-purple/10 hover:text-purple"
                >
                  <span>{m.clan_tag} | {m.ign}</span>
                  <ClanTeamMark team={m.clan_team} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClanTeamMark({ team }: { team: ClanTeam | null | undefined }) {
  const meta = clanTeamMeta(team);
  if (!meta) return null;
  return (
    <span className={`border px-1.5 py-[1px] text-[8.5px] font-semibold uppercase tracking-wide ${CLAN_TEAM_STYLE[meta.id]}`}>
      {meta.label}
    </span>
  );
}
