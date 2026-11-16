"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentKind, TournamentPlayer, TournamentTeam } from "@/lib/supabase/types";
import { getDiscordWebhook, sendDiscord, tournamentEmbed } from "@/lib/discord";
import { buildLeaderboard, buildResults } from "@/lib/tournaments";
import PlayerSelect from "../../PlayerSelect";
import { Segmented } from "../../posters/controls";
import { toastError, toastSuccess } from "../../toast";

interface Member {
  id: string;
  ign: string;
  clan_tag: string;
  status: string;
}

interface PlayerRow {
  id: string;
  member_id: string;
  kills: string;
}

interface TeamRow {
  id: string;
  name: string;
  players: PlayerRow[];
}

const uid = () => crypto.randomUUID();
const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
const emptyPlayers = (n: number): PlayerRow[] => Array.from({ length: n }, () => ({ id: uid(), member_id: "", kills: "" }));

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [size, setSize] = useState<"2" | "4">("2");
  const [kind, setKind] = useState<TournamentKind>("inners");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [savedTeamIds, setSavedTeamIds] = useState<string[]>([]);
  const [savedPlayerIds, setSavedPlayerIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const slots = Number(size);

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, teamRes, memRes] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase.from("tournament_teams").select("*").eq("tournament_id", id),
      supabase.from("members").select("id, ign, clan_tag, status").order("ign"),
    ]);
    if (tRes.error) {
      setError(tRes.error.message);
      setLoading(false);
      return;
    }
    const t = tRes.data as Tournament;
    const teamList = (teamRes.data ?? []) as TournamentTeam[];
    const playerRes = teamList.length
      ? await supabase.from("tournament_players").select("*").in("team_id", teamList.map((x) => x.id))
      : { data: [] as TournamentPlayer[], error: null };
    const playerList = (playerRes.data ?? []) as TournamentPlayer[];

    setName(t.name);
    setDate(t.tournament_date);
    setSize(t.team_size >= 4 ? "4" : "2");
    setKind(t.kind === "other" ? "other" : "inners");
    setMembers((memRes.data ?? []) as Member[]);
    setSavedTeamIds(teamList.map((x) => x.id));
    setSavedPlayerIds(playerList.map((p) => p.id));
    const rows: TeamRow[] = [...teamList]
      .sort((a, b) => a.placement - b.placement)
      .map((tm) => {
        const mine = playerList.filter((p) => p.team_id === tm.id).map((p) => ({ id: p.id, member_id: p.member_id ?? "", kills: String(p.kills) }));
        while (mine.length < t.team_size) mine.push({ id: uid(), member_id: "", kills: "" });
        return { id: tm.id, name: tm.name, players: mine };
      });
    setTeams(rows);
    setDirty(false);
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const edit = (fn: () => void) => {
    fn();
    setDirty(true);
  };

  const used = useMemo(() => new Set(teams.flatMap((t) => t.players.map((p) => p.member_id)).filter(Boolean)), [teams]);

  const pickable = useMemo(() => members.filter((m) => m.status === "ACTIVE" || used.has(m.id)), [members, used]);

  const patchTeam = (tid: string, p: Partial<TeamRow>) => edit(() => setTeams((ts) => ts.map((t) => (t.id === tid ? { ...t, ...p } : t))));
  const patchPlayer = (tid: string, pid: string, p: Partial<PlayerRow>) =>
    edit(() => setTeams((ts) => ts.map((t) => (t.id === tid ? { ...t, players: t.players.map((x) => (x.id === pid ? { ...x, ...p } : x)) } : t))));

  function addTeam() {
    edit(() => setTeams((ts) => [...ts, { id: uid(), name: `Team ${ts.length + 1}`, players: emptyPlayers(slots) }]));
  }

  function changeSize(v: "2" | "4") {
    edit(() => {
      setSize(v);
      setTeams((ts) =>
        ts.map((t) => {
          const players = [...t.players];
          while (players.length < Number(v)) players.push({ id: uid(), member_id: "", kills: "" });
          // drop trailing empty slots when shrinking, but never delete a filled one
          while (players.length > Number(v) && !players[players.length - 1].member_id && !players[players.length - 1].kills) players.pop();
          return { ...t, players };
        }),
      );
    });
  }

  /** Kill totals per team, and each team's rank by total kills (ties share a rank). */
  const totals = useMemo(() => new Map(teams.map((t) => [t.id, t.players.reduce((sum, p) => sum + (p.member_id ? num(p.kills) : 0), 0)])), [teams]);
  const ranks = useMemo(() => {
    const order = [...teams].sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    const out = new Map<string, number>();
    order.forEach((t, i) => {
      const prev = order[i - 1];
      out.set(t.id, prev && totals.get(prev.id) === totals.get(t.id) ? out.get(prev.id)! : i + 1);
    });
    return out;
  }, [teams, totals]);

  async function save() {
    if (!name.trim()) {
      toastError("Give the tournament a name.");
      return;
    }
    setSaving(true);
    setError(null);

    const fail = (message: string) => {
      setError(message);
      toastError(message);
      setSaving(false);
    };

    const info = await supabase.from("tournaments").update({ name: name.trim(), tournament_date: date, team_size: slots, kind }).eq("id", id);
    if (info.error) return fail(info.error.message);

    const keepTeams = new Set(teams.map((t) => t.id));
    const teamPayload = teams.map((t, i) => ({ id: t.id, tournament_id: id, name: t.name.trim() || `Team ${i + 1}`, placement: ranks.get(t.id) ?? i + 1 }));
    if (teamPayload.length) {
      const r = await supabase.from("tournament_teams").upsert(teamPayload);
      if (r.error) return fail(r.error.message);
    }
    const goneTeams = savedTeamIds.filter((x) => !keepTeams.has(x));
    if (goneTeams.length) {
      const r = await supabase.from("tournament_teams").delete().in("id", goneTeams);
      if (r.error) return fail(r.error.message);
    }

    const playerPayload = teams.flatMap((t) =>
      t.players
        .filter((p) => p.member_id)
        .map((p) => ({ id: p.id, team_id: t.id, member_id: p.member_id, ign: byId.get(p.member_id)?.ign ?? "Unknown", kills: num(p.kills) })),
    );
    if (playerPayload.length) {
      const r = await supabase.from("tournament_players").upsert(playerPayload);
      if (r.error) return fail(r.error.message);
    }
    const keepPlayers = new Set(playerPayload.map((p) => p.id));
    const gonePlayers = savedPlayerIds.filter((x) => !keepPlayers.has(x));
    if (gonePlayers.length) {
      const r = await supabase.from("tournament_players").delete().in("id", gonePlayers);
      if (r.error) return fail(r.error.message);
    }

    toastSuccess("Tournament saved.");
    setSaving(false);
    load();
  }

  /* ---------- live summary (from what's on screen) ---------- */

  const summary = useMemo(() => {
    const teamRows: TournamentTeam[] = teams.map((t) => ({ id: t.id, tournament_id: id, name: t.name || "Team", placement: ranks.get(t.id) ?? 1, created_at: "" }));
    const playerRows: TournamentPlayer[] = teams.flatMap((t) =>
      t.players.filter((p) => p.member_id).map((p) => ({ id: p.id, team_id: t.id, member_id: p.member_id, ign: byId.get(p.member_id)?.ign ?? "Unknown", kills: num(p.kills), created_at: "" })),
    );
    const results = buildResults(teamRows, playerRows);
    return { results, board: buildLeaderboard(playerRows) };
  }, [teams, byId, id, ranks]);

  async function postToDiscord() {
    const hook = await getDiscordWebhook(supabase);
    if (!hook) {
      toastError("Add your Discord webhook in Settings first.");
      return;
    }
    if (summary.results.length === 0) {
      toastError("Add some teams first.");
      return;
    }
    const err = await sendDiscord(hook, tournamentEmbed(name, summary.results, summary.board));
    if (err) toastError(err);
    else toastSuccess("Posted to Discord.");
  }

  async function copyResults() {
    const lines = [`🏆 ${name.trim().toUpperCase() || "TOURNAMENT"} – RESULTS`, ""];
    for (const r of summary.results) {
      const names = r.players.map((p) => `${p.ign} ${p.kills}`).join(", ");
      lines.push(`${r.placement}. ${r.name} — ${r.kills} kill${r.kills === 1 ? "" : "s"}${names ? ` (${names})` : ""}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toastSuccess("Results copied.");
    } catch {
      toastError("Couldn't copy to the clipboard.");
    }
  }

  if (loading) return <p className="text-sm text-text-dim">Loading tournament…</p>;
  if (error && !name) return <div className="rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>;

  return (
    <div>
      <Link href="/admin/tournaments" className="mb-3 inline-block text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
        ← All tournaments
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Tournament results</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">{name || "Tournament"}</h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-[11px] uppercase tracking-wide text-amber">Unsaved changes</span>}
          <button onClick={save} disabled={saving} className="btn btn-primary !py-2.5 !text-[11px]">
            {saving ? "Saving…" : "Save results"}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-5">
          <div className="admin-panel">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label>Name</label>
                <input value={name} onChange={(e) => edit(() => setName(e.target.value))} />
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => edit(() => setDate(e.target.value))} />
              </div>
              <div>
                <label>Team size</label>
                <Segmented
                  value={size}
                  onChange={changeSize}
                  options={[
                    { id: "2", label: "Duo (2)" },
                    { id: "4", label: "Squad (4)" },
                  ]}
                />
              </div>
              <div>
                <label>Type</label>
                <Segmented
                  value={kind}
                  onChange={(v) => edit(() => setKind(v))}
                  options={[
                    { id: "inners", label: "Inners" },
                    { id: "other", label: "Other" },
                  ]}
                />
              </div>
            </div>
          </div>

          {teams.length === 0 && <p className="text-sm text-text-dim">No teams yet — add the first team below.</p>}

          {teams.map((t) => {
              const total = totals.get(t.id) ?? 0;
              return (
                <div key={t.id} className="admin-panel">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="flex h-10 min-w-10 items-center justify-center bg-purple/15 px-2 font-display text-[20px] font-bold italic text-purple" title="Ranked by total kills">
                      #{ranks.get(t.id) ?? "–"}
                    </span>
                    <input value={t.name} onChange={(e) => patchTeam(t.id, { name: e.target.value })} className="!w-52" aria-label="Team name" />
                    <span className="ml-auto font-display text-[13px] font-bold uppercase tracking-wide text-text">
                      {total} <span className="text-text-dim">kill{total === 1 ? "" : "s"}</span>
                    </span>
                    <button type="button" onClick={() => edit(() => setTeams((ts) => ts.filter((x) => x.id !== t.id)))} className="text-[10.5px] uppercase tracking-wide text-text-dim hover:text-red">
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {t.players.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <span className="w-6 shrink-0 font-display text-[12px] font-bold text-purple">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <PlayerSelect value={p.member_id} players={pickable} used={used} onChange={(mid) => patchPlayer(t.id, p.id, { member_id: mid })} label={`Player ${i + 1} of ${t.name}`} />
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={p.kills}
                          placeholder="0"
                          onChange={(e) => patchPlayer(t.id, p.id, { kills: e.target.value })}
                          className="!w-20 !text-center"
                          aria-label="Kills"
                        />
                        <span className="w-9 text-[10.5px] uppercase tracking-wide text-text-dim">kills</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
          })}

          <button type="button" onClick={addTeam} className="btn btn-outline w-fit !py-2 !text-[10.5px]">
            + Add team
          </button>
        </div>

        <div className="flex flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
          <div className="admin-panel">
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Standings</div>
              <div className="flex gap-3">
                <button type="button" onClick={postToDiscord} className="text-[10.5px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
                  Post to Discord
                </button>
                <button type="button" onClick={copyResults} className="text-[10.5px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
                  Copy
                </button>
              </div>
            </div>
            {summary.results.length === 0 ? (
              <p className="text-[12px] text-text-dim">Add teams to see standings (ranked by total kills).</p>
            ) : (
              <ul className="space-y-2">
                {summary.results.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="w-6 font-display text-[16px] font-bold italic text-purple">{r.placement}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-text">{r.name}</div>
                      <div className="truncate text-[11px] text-text-dim">{r.players.map((p) => `${p.ign} ${p.kills}`).join(" · ") || "—"}</div>
                    </div>
                    <span className="font-display text-[15px] font-bold text-text">{r.kills}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel">
            <div className="eyebrow mb-3">Top players</div>
            {summary.board.length === 0 ? (
              <p className="text-[12px] text-text-dim">Pick players and enter kills.</p>
            ) : (
              <ol className="space-y-1.5">
                {summary.board.slice(0, 8).map((p, i) => (
                  <li key={p.ign + i} className="flex items-center gap-3 text-[13px]">
                    <span className="w-5 font-display font-bold text-purple">{i + 1}</span>
                    <span className="flex-1 truncate font-semibold text-text">{p.ign}</span>
                    <span className="font-display font-bold text-text">{p.kills}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="admin-panel">
            <div className="eyebrow mb-3">Make a poster</div>
            <p className="mb-3 text-[11.5px] leading-relaxed text-text-dim">Save first — posters are built from the saved results.</p>
            <div className="flex flex-col gap-2">
              <Link href={`/admin/posters?tournament=${id}&template=leaderboard`} className="btn btn-outline !py-2 !text-[10.5px]">
                Player leaderboard
              </Link>
              <Link href={`/admin/posters?tournament=${id}&template=results`} className="btn btn-outline !py-2 !text-[10.5px]">
                Team standings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
