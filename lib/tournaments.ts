import type { SupabaseClient } from "@supabase/supabase-js";
import type { TournamentPlayer, TournamentTeam } from "@/lib/supabase/types";

export interface TeamResult {
  id: string;
  name: string;
  placement: number;
  kills: number;
  players: { ign: string; kills: number; member_id: string | null }[];
}

/** Teams in rank order, each with a kill total and its players (most kills first). */
export function buildResults(teams: TournamentTeam[], players: TournamentPlayer[]): TeamResult[] {
  return teams
    .map((t) => {
      const mine = players
        .filter((p) => p.team_id === t.id)
        .map((p) => ({ ign: p.ign, kills: p.kills, member_id: p.member_id }))
        .sort((a, b) => b.kills - a.kills);
      return { id: t.id, name: t.name, placement: t.placement, kills: mine.reduce((s, p) => s + p.kills, 0), players: mine };
    })
    .sort((a, b) => a.placement - b.placement || a.name.localeCompare(b.name));
}

/** Every player ranked by kills (same member across teams is merged). */
export function buildLeaderboard(players: { ign: string; kills: number; member_id: string | null; clan_tag?: string | null }[]) {
  const totals = new Map<string, { ign: string; kills: number; clan_tag?: string | null }>();
  for (const p of players) {
    const key = p.member_id ?? `ign:${p.ign.toLowerCase()}`;
    const cur = totals.get(key) ?? { ign: p.ign, kills: 0, clan_tag: p.clan_tag };
    cur.kills += p.kills;
    totals.set(key, cur);
  }
  return [...totals.values()].sort((a, b) => b.kills - a.kills || a.ign.localeCompare(b.ign));
}

/** Rows for the Results / Standings poster: `team | kills`. */
export const standingsRows = (results: TeamResult[]) => results.map((r) => `${r.name} | ${r.kills}`).join("\n");

/** Rows for the Player Leaderboard poster: `player | kills`. */
export const leaderboardRows = (board: { ign: string; kills: number }[], limit = 24) =>
  board.slice(0, limit).map((p) => `${p.ign} | ${p.kills}`).join("\n");

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

/** Kills across every Inners tournament (other tournament types are ignored). */
export async function fetchInnersBoard(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tournament_players")
    .select("kills, member_id, ign, members(clan_tag), tournament_teams(tournaments(kind))");
  if (error) return { error: error.message, board: [] as ReturnType<typeof buildLeaderboard> };

  type Row = {
    kills: number;
    member_id: string | null;
    ign: string;
    members: { clan_tag: string } | { clan_tag: string }[] | null;
    tournament_teams: { tournaments: { kind: string } | { kind: string }[] | null } | { tournaments: { kind: string } | { kind: string }[] | null }[] | null;
  };

  const rows = ((data ?? []) as unknown as Row[])
    .filter((r) => one(one(r.tournament_teams)?.tournaments)?.kind === "inners")
    .map((r) => ({ ign: r.ign, kills: r.kills, member_id: r.member_id, clan_tag: one(r.members)?.clan_tag ?? null }));
  return { error: null as string | null, board: buildLeaderboard(rows) };
}
