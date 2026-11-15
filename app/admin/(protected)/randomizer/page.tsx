"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLAN_TEAMS, CLAN_TEAM_STYLE, clanTeamMeta } from "@/lib/gameData";
import SearchBox from "../SearchBox";
import { Segmented } from "../posters/controls";
import { toastError, toastSuccess } from "../toast";

interface Player {
  id: string;
  ign: string;
  clan_tag: string;
  clan_team: string | null;
}

type TeamSize = "2" | "4";

const label = (p: Player) => `${p.clan_tag}丨${p.ign}`;

/** Unbiased random integer in [0, n) using the browser's crypto RNG. */
function randInt(n: number) {
  const a = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  let x = 0;
  do {
    crypto.getRandomValues(a);
    x = a[0];
  } while (x >= limit);
  return x % n;
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTeams(players: Player[], size: number, even: boolean, mix: boolean): Player[][] {
  if (players.length === 0) return [];
  const teamCount = Math.ceil(players.length / size);

  if (mix) {
    // Shuffle inside each clan team, order best → worst, then deal in a snake so every team gets a spread.
    const order = [...CLAN_TEAMS.map((t) => t.id as string), ""];
    const tiers = order.map((id) => shuffle(players.filter((p) => (p.clan_team ?? "") === id)));
    const ordered = tiers.flat();
    const teams: Player[][] = Array.from({ length: teamCount }, () => []);
    ordered.forEach((p, i) => {
      const lap = Math.floor(i / teamCount);
      const pos = i % teamCount;
      teams[lap % 2 === 0 ? pos : teamCount - 1 - pos].push(p);
    });
    return shuffle(teams);
  }

  const mixed = shuffle(players);
  if (even) {
    const teams: Player[][] = Array.from({ length: teamCount }, () => []);
    mixed.forEach((p, i) => teams[i % teamCount].push(p));
    return teams;
  }
  const teams: Player[][] = [];
  for (let i = 0; i < mixed.length; i += size) teams.push(mixed.slice(i, i + size));
  return teams;
}

export default function RandomizerPage() {
  const supabase = useMemo(() => createClient(), []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<TeamSize>("4");
  const [even, setEven] = useState(true);
  const [mix, setMix] = useState(false);
  const [teams, setTeams] = useState<Player[][] | null>(null);
  const [rolling, setRolling] = useState(false);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, ign, clan_tag, clan_team")
      .eq("status", "ACTIVE")
      .order("ign");
    if (error) {
      setError(error.message);
    } else {
      const list = (data ?? []) as Player[];
      setPlayers(list);
      setSelected(new Set(list.map((p) => p.id)));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(load);
    const t = timers.current;
    return () => {
      clearInterval(t.tick);
      clearTimeout(t.stop);
    };
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => !q || `${p.clan_tag} ${p.ign}`.toLowerCase().includes(q));
  }, [players, query]);

  const pool = useMemo(() => players.filter((p) => selected.has(p.id)), [players, selected]);
  const n = Number(size);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setMany(list: Player[], on: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      list.forEach((p) => (on ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  }

  function roll() {
    if (pool.length < 2 || rolling) return;
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.stop);
    const final = makeTeams(pool, n, even, mix);
    setRolling(true);
    timers.current.tick = setInterval(() => setTeams(makeTeams(pool, n, even, mix)), 80);
    timers.current.stop = setTimeout(() => {
      clearInterval(timers.current.tick);
      setTeams(final);
      setRolling(false);
    }, 1000);
  }

  const noun = n === 2 ? "Duo" : "Squad";

  async function copy() {
    if (!teams) return;
    const text = [`🎲 Random ${noun.toLowerCase()}s`, ...teams.map((t, i) => `${noun} ${i + 1}: ${t.map(label).join(" + ")}`)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("Copied — paste it in the group.");
    } catch {
      toastError("Couldn't copy to the clipboard.");
    }
  }

  const tooFew = pool.length < 2;

  return (
    <div>
      <div className="mb-6">
        <div className="eyebrow mb-2.5">Team picker</div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">Randomizer</h1>
        <p className="mt-2 max-w-lg text-[13px] text-text-dim">Tick who&apos;s online, choose duo or squad, and roll fair random teams.</p>
      </div>

      {error && <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* pool */}
        <div className="admin-panel !p-0">
          <div className="border-b border-line px-4 py-3.5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-purple">Players online</h3>
              <span className="text-[11.5px] text-text-dim">
                <b className="text-text">{pool.length}</b> / {players.length} selected
              </span>
            </div>
            <SearchBox value={query} onChange={setQuery} placeholder="Search players…" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" className="admin-chip" onClick={() => setMany(players, true)}>All</button>
              <button type="button" className="admin-chip" onClick={() => setMany(players, false)}>None</button>
              {CLAN_TEAMS.map((t) => (
                <button key={t.id} type="button" className="admin-chip" onClick={() => setSelected(new Set(players.filter((p) => p.clan_team === t.id).map((p) => p.id)))}>
                  Only {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-4 text-sm text-text-dim">Loading roster…</p>
            ) : visible.length === 0 ? (
              <p className="px-4 py-4 text-sm text-text-dim">{players.length === 0 ? "No active members yet." : "No players match your search."}</p>
            ) : (
              visible.map((p) => {
                const on = selected.has(p.id);
                const meta = clanTeamMeta(p.clan_team);
                return (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-3 border-b border-line/60 px-4 py-2.5 !normal-case hover:bg-white/[0.03] ${on ? "" : "opacity-50"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="!h-4 !min-h-0 !w-4 !p-0" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">{label(p)}</span>
                    {meta && <span className={`border px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-wide ${CLAN_TEAM_STYLE[meta.id]}`}>{meta.label}</span>}
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* controls + result */}
        <div>
          <div className="admin-panel mb-5">
            <div className="flex flex-wrap items-end gap-5">
              <div className="min-w-[200px]">
                <label>Team size</label>
                <Segmented
                  value={size}
                  onChange={setSize}
                  options={[
                    { id: "2", label: "Duo (2)" },
                    { id: "4", label: "Squad (4)" },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 !normal-case">
                  <input type="checkbox" checked={even} onChange={(e) => setEven(e.target.checked)} className="!h-4 !min-h-0 !w-4 !p-0" />
                  <span className="text-[11.5px] uppercase tracking-[0.08em] text-text-dim">Even out leftovers (4+3+3, not 4+4+2)</span>
                </label>
                <label className="flex items-center gap-2 !normal-case">
                  <input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} className="!h-4 !min-h-0 !w-4 !p-0" />
                  <span className="text-[11.5px] uppercase tracking-[0.08em] text-text-dim">Spread E-Sport / Elites / Underdog across teams</span>
                </label>
              </div>
              <button type="button" onClick={roll} disabled={tooFew || rolling} className="btn btn-primary ml-auto">
                {rolling ? "Rolling…" : teams ? "Re-roll" : "Randomize"}
              </button>
            </div>
            {tooFew && !loading && <p className="mt-3 text-[11.5px] text-amber">Select at least 2 players.</p>}
            {!tooFew && (
              <p className="mt-3 text-[11.5px] text-text-dim">
                {pool.length} players → {Math.ceil(pool.length / n)} {noun.toLowerCase()}
                {Math.ceil(pool.length / n) === 1 ? "" : "s"}
                {pool.length % n !== 0 && !even && !mix ? ` (last one has ${pool.length % n})` : ""}
              </p>
            )}
          </div>

          {teams && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="eyebrow">{teams.length} {noun.toLowerCase()}{teams.length === 1 ? "" : "s"}</div>
                <button type="button" onClick={copy} disabled={rolling} className="btn btn-outline !px-3 !py-1.5 !text-[10px]">
                  Copy for WhatsApp
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {teams.map((t, i) => (
                  <div key={i} className={`admin-stat transition-opacity ${rolling ? "opacity-80" : ""}`}>
                    <div className="admin-stat-index">
                      {noun} {i + 1}
                      {t.length < n && <span className="ml-2 text-amber">· {t.length} player{t.length === 1 ? "" : "s"}</span>}
                    </div>
                    <ul className="space-y-1.5">
                      {t.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-[14px] font-semibold text-text">
                          <span className="truncate">{label(p)}</span>
                          {clanTeamMeta(p.clan_team) && <span className="shrink-0 text-[9.5px] uppercase tracking-wide text-text-dim">{clanTeamMeta(p.clan_team)?.label}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
