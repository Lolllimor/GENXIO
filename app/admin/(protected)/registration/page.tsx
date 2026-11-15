"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLAN_TEAMS } from "@/lib/gameData";
import { toastError, toastSuccess } from "../toast";
import PlayerSelect from "../PlayerSelect";

interface Player {
  id: string;
  ign: string;
  clan_tag: string;
  clan_team: string | null;
}

interface RegTeam {
  key: string;
  name: string;
  tag: string;
  manager: string;
  starters: string[]; // member ids, "" = empty (always 4)
  subs: string[]; // member ids (0–4)
}

const SETTINGS_KEY = "genxio.registration.v1";
const TEAM_NAMES: Record<string, string> = { "e-sport": "Genxio Esports", elites: "Genxio Elites", underdog: "Genxio Underdogs" };
const uid = () => Math.random().toString(36).slice(2, 9);

const newTeam = (manager: string, name = ""): RegTeam => ({ key: uid(), name, tag: "G¹丨", manager, starters: ["", "", "", ""], subs: [] });

function PlayerSlot({ tag, value, players, used, onChange, onRemove }: { tag: string; value: string; players: Player[]; used: Set<string>; onChange: (id: string) => void; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-7 shrink-0 font-display text-[12px] font-bold tracking-wide text-purple">{tag}</span>
      <div className="min-w-0 flex-1">
        <PlayerSelect value={value} players={players} used={used} onChange={onChange} label={`Player for ${tag}`} />
      </div>
      {onRemove && (
        <button type="button" aria-label="Remove sub" onClick={onRemove} className="text-text-dim hover:text-red">
          ×
        </button>
      )}
    </div>
  );
}

export default function ScrimRegistrationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [event, setEvent] = useState("NGN SCRIMS");
  const [manager, setManager] = useState("");
  const [teams, setTeams] = useState<RegTeam[]>([newTeam("", "Genxio Esports")]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const sorted = useMemo(() => [...players].sort((a, b) => a.ign.localeCompare(b.ign, undefined, { sensitivity: "base" })), [players]);
  const label = useCallback((id: string) => {
    const p = byId.get(id);
    return p ? `${p.clan_tag}丨${p.ign}` : "";
  }, [byId]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("id, ign, clan_tag, clan_team").eq("status", "ACTIVE").order("ign");
    if (error) setError(error.message);
    else setPlayers((data ?? []) as Player[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as { event?: string; manager?: string } | null;
        if (saved?.event) setEvent(saved.event);
        if (saved?.manager) {
          setManager(saved.manager);
          setTeams((t) => t.map((x) => (x.manager ? x : { ...x, manager: saved.manager! })));
        }
      } catch {
        /* no saved settings */
      }
      load();
    });
  }, [load]);

  function remember(next: { event?: string; manager?: string }) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ event, manager, ...next }));
    } catch {
      /* storage unavailable */
    }
  }

  const used = useMemo(() => new Set(teams.flatMap((t) => [...t.starters, ...t.subs]).filter(Boolean)), [teams]);

  const patchTeam = (key: string, p: Partial<RegTeam>) => setTeams((ts) => ts.map((t) => (t.key === key ? { ...t, ...p } : t)));

  function setSlot(key: string, kind: "starters" | "subs", index: number, id: string) {
    setTeams((ts) =>
      ts.map((t) => {
        if (t.key !== key) return t;
        const list = [...t[kind]];
        list[index] = id;
        return { ...t, [kind]: list };
      }),
    );
  }

  function autoFill() {
    const groups = CLAN_TEAMS.map((c) => ({ id: c.id as string, members: sorted.filter((p) => p.clan_team === c.id) })).filter((g) => g.members.length > 0);
    if (groups.length === 0) {
      toastError("No members are assigned to a clan team yet.");
      return;
    }
    setTeams(
      groups.map((g) => {
        const ids = g.members.map((m) => m.id);
        const starters = [0, 1, 2, 3].map((i) => ids[i] ?? "");
        return { key: uid(), name: TEAM_NAMES[g.id] ?? g.id, tag: "G¹丨", manager, starters, subs: ids.slice(4, 8) };
      }),
    );
    toastSuccess("Filled from your clan teams — adjust anything you like.");
  }

  const text = useMemo(() => {
    const head = `📋 TEAM REGISTRATION – ${event.trim() || "SCRIMS"}`;
    const blocks = teams.map((t) => {
      const lines = [`Team Name: ${t.name}`, `Team Tag: ${t.tag}`, `Manager: ${t.manager}`, "", ...t.starters.map((id, i) => `P${i + 1}: ${label(id)}`)];
      const subs = t.subs.filter(Boolean);
      if (subs.length) lines.push("", ...subs.map((id, i) => `S${i + 1}: ${label(id)}`));
      return lines.join("\n");
    });
    return [head, "", blocks.join("\n\n")].join("\n");
  }, [event, teams, label]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("Copied — paste it in the group.");
    } catch {
      toastError("Couldn't copy to the clipboard.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Competition</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">Scrim Registration</h1>
          <p className="mt-2 max-w-lg text-[13px] text-text-dim">Pick your players for each team and copy the registration message.</p>
        </div>
        <button type="button" onClick={autoFill} disabled={loading} className="btn btn-outline !py-2 !text-[10.5px]">
          Auto-fill from clan teams
        </button>
      </div>

      {error && <div className="mb-4 rounded-sm border border-red bg-red/10 px-3.5 py-3 text-[12.5px] text-red">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="flex flex-col gap-5">
          <div className="admin-panel">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label>Event</label>
                <input value={event} onChange={(e) => { setEvent(e.target.value); remember({ event: e.target.value }); }} placeholder="NGN SCRIMS" />
              </div>
              <div>
                <label>Default manager</label>
                <input
                  value={manager}
                  onChange={(e) => {
                    const v = e.target.value;
                    setManager(v);
                    setTeams((ts) => ts.map((t) => (t.manager === manager ? { ...t, manager: v } : t)));
                    remember({ manager: v });
                  }}
                  placeholder="e.g. Lollimor"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-text-dim">Loading roster…</p>
          ) : (
            teams.map((t, ti) => (
              <div key={t.key} className="admin-panel">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-purple">Team {ti + 1}</h3>
                  {teams.length > 1 && (
                    <button type="button" onClick={() => setTeams((ts) => ts.filter((x) => x.key !== t.key))} className="text-[10.5px] uppercase tracking-wide text-text-dim hover:text-red">
                      Remove team
                    </button>
                  )}
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label>Team name</label>
                    <input value={t.name} onChange={(e) => patchTeam(t.key, { name: e.target.value })} />
                  </div>
                  <div>
                    <label>Team tag</label>
                    <input value={t.tag} onChange={(e) => patchTeam(t.key, { tag: e.target.value })} />
                  </div>
                  <div>
                    <label>Manager</label>
                    <input value={t.manager} onChange={(e) => patchTeam(t.key, { manager: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-x-6 gap-y-2.5 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <div className="eyebrow mb-1">Starters</div>
                    {[0, 1, 2, 3].map((i) => (
                      <PlayerSlot key={i} tag={`P${i + 1}`} value={t.starters[i] ?? ""} players={sorted} used={used} onChange={(id) => setSlot(t.key, "starters", i, id)} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="eyebrow mb-1">Substitutes</div>
                    {t.subs.map((_, i) => (
                      <PlayerSlot
                        key={i}
                        tag={`S${i + 1}`}
                        value={t.subs[i] ?? ""}
                        players={sorted}
                        used={used}
                        onChange={(id) => setSlot(t.key, "subs", i, id)}
                        onRemove={() => patchTeam(t.key, { subs: t.subs.filter((_, j) => j !== i) })}
                      />
                    ))}
                    {t.subs.length < 4 && (
                      <button type="button" onClick={() => patchTeam(t.key, { subs: [...t.subs, ""] })} className="w-fit text-[11px] font-semibold uppercase tracking-wide text-purple hover:brightness-125">
                        + Add sub
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          <button type="button" onClick={() => setTeams((ts) => [...ts, newTeam(manager)])} className="btn btn-outline w-fit !py-2 !text-[10.5px]">
            + Add another team
          </button>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <div className="eyebrow">Message preview</div>
            <button type="button" onClick={copy} className="btn btn-primary !px-4 !py-2 !text-[10.5px]">
              Copy message
            </button>
          </div>
          <pre className="admin-panel max-h-[70vh] overflow-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed text-text">{text}</pre>
        </div>
      </div>
    </div>
  );
}
