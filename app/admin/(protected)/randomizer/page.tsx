"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLAN_TEAMS, CLAN_TEAM_STYLE, clanTeamMeta } from "@/lib/gameData";
import SearchBox from "../SearchBox";
import { Segmented } from "../posters/controls";
import { toastError, toastSuccess } from "../toast";
import Wheel, { WHEEL_COLORS, evenLayout, type WheelSegment } from "./Wheel";

interface Player {
  id: string;
  ign: string;
  clan_tag: string;
  clan_team: string | null;
}

type TeamSize = "2" | "4";

const SPIN_MS = 4200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
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

/** Instant (no wheel) team building. */
function makeTeams(players: Player[], size: number, even: boolean): Player[][] {
  if (players.length === 0) return [];
  const teamCount = Math.ceil(players.length / size);
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
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<TeamSize>("2");
  const [even, setEven] = useState(true);

  // the draw
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState<Player[]>([]);
  const [segs, setSegs] = useState<WheelSegment[]>([]); // the wheel as drawn; picked players are removed with an animation
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Player[][]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [lastPick, setLastPick] = useState<{ p: Player; team: number; slot: number } | null>(null);
  const [auto, setAuto] = useState(false);
  const [starting, setStarting] = useState(false);

  // refs let the async spin loop always see the latest draw state
  const startedRef = useRef(false);
  const remRef = useRef<Player[]>([]);
  const segRef = useRef<WheelSegment[]>([]);
  const colorRef = useRef<Map<string, string>>(new Map());
  const rotRef = useRef(0);
  const teamsRef = useRef<Player[][]>([]);
  const autoRef = useRef(false);

  const n = Number(size);
  const noun = n === 2 ? "Duo" : "Squad";

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("id, ign, clan_tag, clan_team").eq("status", "ACTIVE").order("ign");
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
    return () => {
      autoRef.current = false;
    };
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => !q || `${p.clan_tag} ${p.ign}`.toLowerCase().includes(q));
  }, [players, query]);

  const pool = useMemo(() => players.filter((p) => selected.has(p.id)), [players, selected]);
  const wheelSegs = useMemo(
    () => (started ? segs : evenLayout(pool, (id) => WHEEL_COLORS[pool.findIndex((p) => p.id === id) % WHEEL_COLORS.length])),
    [started, segs, pool],
  );
  const plannedTeams = started ? Math.max(teams.length, Math.ceil((teams.reduce((s, t) => s + t.length, 0) + remaining.length) / n)) : Math.ceil(pool.length / n);
  const done = started && remaining.length === 0;
  const locked = started && !done;

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

  function reset() {
    autoRef.current = false;
    startedRef.current = false;
    remRef.current = [];
    segRef.current = [];
    colorRef.current = new Map();
    rotRef.current = 0;
    teamsRef.current = [];
    setAuto(false);
    setStarted(false);
    setRemaining([]);
    setSegs([]);
    setHighlightId(null);
    setTeams([]);
    setLastPick(null);
    setSpinning(false);
    setAnimate(false);
    setRotation(0);
  }

  /** Smoothly remove a picked player's segment: it collapses into a seam while the others widen to fill the gap. */
  async function collapse(winnerId: string, rest: Player[]) {
    const from = segRef.current;
    const to = evenLayout(rest, (id) => colorRef.current.get(id) ?? WHEEL_COLORS[0]);
    const toMap = new Map(to.map((x) => [x.id, x]));
    const wi = from.findIndex((x) => x.id === winnerId);
    const next = from.slice(wi + 1).find((x) => toMap.has(x.id));
    const prev = [...from.slice(0, wi)].reverse().find((x) => toMap.has(x.id));
    const seam = next ? toMap.get(next.id)!.a0 : prev ? toMap.get(prev.id)!.a1 : 0;

    const DURATION = 520;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const e = 1 - Math.pow(1 - t, 3);
        setSegs(
          from.map((x) => {
            const tgt = x.id === winnerId ? { a0: seam, a1: seam } : toMap.get(x.id)!;
            return { ...x, a0: x.a0 + (tgt.a0 - x.a0) * e, a1: x.a1 + (tgt.a1 - x.a1) * e };
          }),
        );
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
      setTimeout(resolve, DURATION + 150); // never get stuck if frames are throttled
    });
    segRef.current = to;
    setSegs(to);
  }

  /** Spin once: land on one player, put them in the current team, then remove them from the wheel. The wheel keeps turning from wherever it stopped. */
  async function spinOnce(): Promise<boolean> {
    if (!startedRef.current) {
      remRef.current = pool;
      teamsRef.current = [];
      rotRef.current = 0;
      startedRef.current = true;
      colorRef.current = new Map(pool.map((p, i) => [p.id, WHEEL_COLORS[i % WHEEL_COLORS.length]]));
      const init = evenLayout(pool, (id) => colorRef.current.get(id) ?? WHEEL_COLORS[0]);
      segRef.current = init;
      setSegs(init);
    }
    const list = remRef.current;
    if (list.length === 0) return false;

    // choose among the players still in the draw, then aim at that player's segment as it is drawn right now
    const winner = list[randInt(list.length)];
    const seg = segRef.current.find((x) => x.id === winner.id)!;
    const jitter = (Math.random() - 0.5) * (seg.a1 - seg.a0) * 0.7; // anywhere inside the segment, never on an edge
    const desired = (((-((seg.a0 + seg.a1) / 2) + jitter) % 360) + 360) % 360;
    const curMod = ((rotRef.current % 360) + 360) % 360;
    const finalRot = rotRef.current + 360 * (5 + randInt(3)) + ((((desired - curMod) % 360) + 360) % 360);
    rotRef.current = finalRot;

    setHighlightId(null);
    setStarted(true);
    setSpinning(true);
    setAnimate(true);
    setRotation(finalRot);
    await sleep(SPIN_MS + 120);

    const t = teamsRef.current.map((x) => [...x]);
    if (t.length === 0 || t[t.length - 1].length >= n) t.push([]);
    t[t.length - 1].push(winner);
    const rest = list.filter((p) => p.id !== winner.id);
    teamsRef.current = t;
    remRef.current = rest;

    setTeams(t);
    setRemaining(rest);
    setLastPick({ p: winner, team: t.length, slot: t[t.length - 1].length });
    setSpinning(false);

    // flash the winning segment, then remove it
    setHighlightId(winner.id);
    await sleep(750);
    setHighlightId(null);
    await collapse(winner.id, rest);
    return rest.length > 0;
  }

  async function runAuto() {
    if (autoRef.current) return;
    autoRef.current = true;
    setAuto(true);
    while (autoRef.current) {
      const more = await spinOnce();
      if (!more) break;
      await sleep(900);
    }
    autoRef.current = false;
    setAuto(false);
  }

  /** Skip the wheel and build all teams instantly. */
  function instantRoll() {
    if (pool.length < 2) return;
    reset();
    const built = makeTeams(pool, n, even);
    startedRef.current = true;
    remRef.current = [];
    segRef.current = [];
    teamsRef.current = built;
    setSegs([]);
    setStarted(true);
    setTeams(built);
    setRemaining([]);
    setLastPick(null);
  }

  async function copy() {
    const text = [`🎲 Random ${noun.toLowerCase()}s`, ...teams.map((t, i) => `${noun} ${i + 1}: ${t.map(label).join(" + ")}`)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("Copied — paste it in the group.");
    } catch {
      toastError("Couldn't copy to the clipboard.");
    }
  }

  /** Turn the teams into a tournament, ready for kills to be entered. */
  async function startTournament() {
    if (!done || starting) return;
    setStarting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const today = new Date();
    const created = await supabase
      .from("tournaments")
      .insert({
        name: `Inners ${today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        tournament_date: today.toISOString().slice(0, 10),
        team_size: n,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    if (created.error) {
      setStarting(false);
      toastError(/tournaments/i.test(created.error.message) ? "Run supabase/add_tournaments.sql in the Supabase SQL editor first." : created.error.message);
      return;
    }
    const tid = created.data.id as string;
    const teamRows = teams.map((_, i) => ({ id: crypto.randomUUID(), tournament_id: tid, name: `Team ${i + 1}`, placement: i + 1 }));
    const teamRes = await supabase.from("tournament_teams").insert(teamRows);
    const playerRes = teamRes.error
      ? null
      : await supabase.from("tournament_players").insert(teams.flatMap((t, i) => t.map((p) => ({ team_id: teamRows[i].id, member_id: p.id, ign: p.ign, kills: 0 }))));
    const failure = teamRes.error ?? playerRes?.error;
    if (failure) {
      setStarting(false);
      toastError(failure.message);
      return;
    }
    toastSuccess("Tournament created — enter the kills.");
    router.push(`/admin/tournaments/${tid}`);
  }

  const tooFew = pool.length < 2;
  const currentTeam = started && teams.length > 0 && teams[teams.length - 1].length < n ? teams.length - 1 : teams.length;
  const nextSlot = currentTeam < teams.length ? teams[currentTeam].length + 1 : 1;
  const hubLabel = spinning ? "…" : done ? "Done ✓" : lastPick ? lastPick.p.ign : "Spin";

  return (
    <div>
      <div className="mb-6">
        <div className="eyebrow mb-2.5">Team picker</div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">Randomizer</h1>
        <p className="mt-2 max-w-lg text-[13px] text-text-dim">Spin the wheel to pick teammates one at a time — each team fills up before the next begins.</p>
      </div>

      {error && <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* pool */}
        <div className={`admin-panel !p-0 ${locked ? "pointer-events-none opacity-60" : ""}`}>
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

          <div className="max-h-[560px] overflow-y-auto">
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
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="admin-check" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">{label(p)}</span>
                    {meta && <span className={`border px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-wide ${CLAN_TEAM_STYLE[meta.id]}`}>{meta.label}</span>}
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* wheel + teams */}
        <div>
          <div className="admin-panel mb-5">
            <div className="flex flex-wrap items-end gap-5">
              <div className={`min-w-[200px] ${locked ? "pointer-events-none opacity-60" : ""}`}>
                <label>Team size</label>
                <Segmented
                  value={size}
                  onChange={(v) => {
                    reset();
                    setSize(v);
                  }}
                  options={[
                    { id: "2", label: "Duo (2)" },
                    { id: "4", label: "Squad (4)" },
                  ]}
                />
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {started && (
                  <button type="button" onClick={reset} disabled={spinning} className="btn btn-outline !py-2 !text-[10.5px]">
                    Start over
                  </button>
                )}
              </div>
            </div>
            {tooFew && !loading && <p className="mt-3 text-[11.5px] text-amber">Select at least 2 players.</p>}
            {!tooFew && !started && (
              <p className="mt-3 text-[11.5px] text-text-dim">
                {pool.length} players → {Math.ceil(pool.length / n)} {noun.toLowerCase()}
                {Math.ceil(pool.length / n) === 1 ? "" : "s"}
                {pool.length % n !== 0 ? ` (the last one has ${pool.length % n})` : ""}
              </p>
            )}
          </div>

          <div className="admin-panel mb-5">
            <Wheel segments={wheelSegs} highlightId={highlightId} rotation={rotation} animate={animate} ms={SPIN_MS} centerLabel={hubLabel} />

            <div className="mt-4 min-h-[44px] text-center">
              {spinning ? (
                <p className="font-display text-[15px] font-bold uppercase tracking-[0.14em] text-amber">Picking for {noun} {currentTeam + 1} · slot {nextSlot}…</p>
              ) : lastPick ? (
                <p className="font-display text-[15px] font-bold uppercase tracking-[0.1em] text-text">
                  🎯 <span className="text-purple">{label(lastPick.p)}</span> → {noun} {lastPick.team}, slot {lastPick.slot}
                </p>
              ) : (
                <p className="text-[12px] text-text-dim">Press spin — {noun} 1 picks first.</p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {!done && (
                <>
                  <button type="button" onClick={() => spinOnce()} disabled={tooFew || spinning || auto} className="btn btn-primary !px-8">
                    {spinning && !auto ? "Spinning…" : `Spin for ${noun} ${currentTeam + 1}`}
                  </button>
                  {auto ? (
                    <button type="button" onClick={() => (autoRef.current = false)} className="btn btn-outline !py-2.5 !text-[10.5px]">
                      Stop auto
                    </button>
                  ) : (
                    <button type="button" onClick={runAuto} disabled={tooFew || spinning} className="btn btn-outline !py-2.5 !text-[10.5px]">
                      Auto-spin to the end
                    </button>
                  )}
                </>
              )}
              {!started && (
                <button type="button" onClick={instantRoll} disabled={tooFew} className="text-[10.5px] font-semibold uppercase tracking-wide text-text-dim hover:text-purple">
                  Skip the wheel
                </button>
              )}
            </div>
            {!started && (
              <label className="mx-auto mt-3 flex w-fit items-center gap-2 !normal-case">
                <input type="checkbox" checked={even} onChange={(e) => setEven(e.target.checked)} className="admin-check" />
                <span className="text-[11px] uppercase tracking-[0.08em] text-text-dim">“Skip the wheel” evens out leftovers (4+3+3)</span>
              </label>
            )}
          </div>

          {started && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="eyebrow">
                  {plannedTeams} {noun.toLowerCase()}
                  {plannedTeams === 1 ? "" : "s"}
                  {done ? " · all picked" : ` · ${remaining.length} left on the wheel`}
                </div>
                {done && (
                  <div className="flex gap-2">
                    <button type="button" onClick={copy} className="btn btn-outline !px-3 !py-1.5 !text-[10px]">
                      Copy for WhatsApp
                    </button>
                    <button type="button" onClick={startTournament} disabled={starting} className="btn btn-primary !px-3 !py-1.5 !text-[10px]">
                      {starting ? "Creating…" : "Start tournament"}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: plannedTeams }, (_, ti) => {
                  const t = teams[ti] ?? [];
                  const active = ti === currentTeam && !done;
                  return (
                    <div key={ti} className={`admin-stat ${active ? "ring-1 ring-amber/70" : ""}`} data-tone={active ? "amber" : "purple"}>
                      <div className="admin-stat-index">
                        {noun} {ti + 1}
                        {active && <span className="ml-2 text-amber">· picking</span>}
                        {t.length > 0 && t.length < n && done && <span className="ml-2 text-amber">· {t.length} player{t.length === 1 ? "" : "s"}</span>}
                      </div>
                      <ul className="space-y-1.5">
                        {Array.from({ length: n }, (_, si) => {
                          const p = t[si];
                          const fresh = lastPick && lastPick.team === ti + 1 && lastPick.slot === si + 1;
                          return p ? (
                            <li key={si} className={`flex items-center justify-between gap-2 text-[14px] font-semibold text-text ${fresh ? "animate-[pickin_0.5s_ease-out]" : ""}`}>
                              <span className="truncate">{label(p)}</span>
                              {clanTeamMeta(p.clan_team) && <span className="shrink-0 text-[9.5px] uppercase tracking-wide text-text-dim">{clanTeamMeta(p.clan_team)?.label}</span>}
                            </li>
                          ) : done ? null : (
                            <li key={si} className="border border-dashed border-line px-2 py-1 text-[12px] text-text-dim/60">slot {si + 1}</li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
