"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toastError, toastSuccess } from "../toast";
import Canvas from "./Canvas";
import { fieldKey } from "./context";
import { download, renderPoster, type ExportType } from "./export";
import { FORMATS, FORMAT_LIST } from "./formats";
import { createClient } from "@/lib/supabase/client";
import type { TournamentPlayer, TournamentTeam } from "@/lib/supabase/types";
import { buildLeaderboard, buildResults, fetchInnersBoard, leaderboardRows, standingsRows } from "@/lib/tournaments";
import { fileToDataUrl, loadAssets, loadDrafts, saveAssets, saveDrafts, type Assets, type Draft } from "./library";
import { DEFAULT_DROPS, type MapPresets } from "./maps";
import LeftPanel from "./LeftPanel";
import PosterView from "./PosterView";
import RightPanel from "./RightPanel";
import { getTemplate, makeDoc } from "./templates/registry";
import type { Adjust, BgState, FormatId, PosterDoc } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Editor() {
  const [doc, setDoc] = useState<PosterDoc>(() => makeDoc("tournament"));
  const [selected, setSelected] = useState<string | null>(null);
  const [assets, setAssets] = useState<Assets>({ logos: [], backgrounds: [] });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [presets, setPresetsState] = useState<MapPresets>(DEFAULT_DROPS);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<{ type: ExportType; ratio: number } | null>(null);

  const params = useSearchParams();
  const tournamentParam = params.get("tournament");
  const templateParam = params.get("template");
  const imported = useRef(false);

  const posterRef = useRef<HTMLDivElement>(null);
  const batchRefs = useRef<Partial<Record<FormatId, HTMLDivElement | null>>>({});

  const supabase = useMemo(() => createClient(), []);
  const tpl = useMemo(() => getTemplate(doc.templateId), [doc.templateId]);

  useEffect(() => {
    queueMicrotask(() => {
      setAssets(loadAssets());
      setDrafts(loadDrafts());
    });
    supabase
      .from("poster_map_drops")
      .select("map_name, drops")
      .then(({ data, error }) => {
        if (error) {
          console.warn("Couldn't load hot-drop lists (using defaults):", error.message);
          return;
        }
        const saved = Object.fromEntries((data ?? []).map((r) => [r.map_name as string, (r.drops as string[]) ?? []]));
        setPresetsState((cur) => ({ ...cur, ...saved }));
      });
  }, [supabase]);

  // Arriving from a tournament page: load its saved results into the chosen template.
  useEffect(() => {
    if (!tournamentParam || imported.current) return;
    imported.current = true;
    (async () => {
      const t = await supabase.from("tournaments").select("name").eq("id", tournamentParam).single();
      const teamRes = await supabase.from("tournament_teams").select("*").eq("tournament_id", tournamentParam);
      const teams = (teamRes.data ?? []) as TournamentTeam[];
      const playerRes = teams.length ? await supabase.from("tournament_players").select("*, members(ign)").in("team_id", teams.map((x) => x.id)) : { data: [] };
      if (t.error || teamRes.error) {
        toastError(t.error?.message ?? teamRes.error?.message ?? "Couldn't load that tournament.");
        return;
      }
      type LivePlayer = TournamentPlayer & { members?: { ign: string } | { ign: string }[] | null };
      // use each player's current name (they may have been renamed since the tournament)
      const players = ((playerRes.data ?? []) as LivePlayer[]).map((p) => {
        const live = Array.isArray(p.members) ? p.members[0] : p.members;
        return { ...p, ign: live?.ign ?? p.ign };
      });
      const results = buildResults(teams, players);
      const board = buildLeaderboard(players);
      const id = templateParam === "results" ? "results" : "leaderboard";
      const tpl = getTemplate(id);
      const set = (field: string, value: string) => ({ [fieldKey(tpl, field)]: value });
      const values =
        id === "results"
          ? { ...set("title", t.data?.name ?? ""), ...set("standings", standingsRows(results)), ...set("col2", "Kills"), ...set("col3", "") }
          : { ...set("event", t.data?.name ?? ""), ...set("rows", leaderboardRows(board)) };
      setDoc((d) => ({ ...d, templateId: id, bg: d.bg.src === getTemplate(d.templateId).defaultBg ? { ...d.bg, src: tpl.defaultBg, dim: tpl.defaultDim ?? 0.04 } : d.bg, values: { ...d.values, ...values } }));
      toastSuccess(`Loaded “${t.data?.name}” into the ${tpl.name} template.`);
    })();
  }, [tournamentParam, templateParam, supabase]);

  /* ---------- doc mutations ---------- */

  const patch = useCallback((p: Partial<PosterDoc>) => setDoc((d) => ({ ...d, ...p })), []);

  const setTemplate = useCallback((id: string) => {
    setDoc((d) => {
      const prev = getTemplate(d.templateId);
      const next = getTemplate(id);
      const usingDefaultBg = d.bg.src === prev.defaultBg;
      return { ...d, templateId: id, bg: usingDefaultBg ? { ...d.bg, src: next.defaultBg, dim: next.defaultDim ?? 0.04 } : d.bg };
    });
    setSelected(null);
  }, []);

  const setBg = useCallback((p: Partial<BgState>) => setDoc((d) => ({ ...d, bg: { ...d.bg, ...p } })), []);

  const setValue = useCallback((id: string, v: string) => setDoc((d) => ({ ...d, values: { ...d.values, [fieldKey(getTemplate(d.templateId), id)]: v } })), []);

  const setImage = useCallback((id: string, src: string | null) => setDoc((d) => ({ ...d, images: { ...d.images, [fieldKey(getTemplate(d.templateId), id)]: src } })), []);

  const toggleHidden = useCallback((key: string) => setDoc((d) => ({ ...d, hidden: { ...d.hidden, [key]: !d.hidden[key] } })), []);

  const setAdjust = useCallback((id: string, p: Partial<Adjust>) => {
    setDoc((d) => {
      const k = fieldKey(getTemplate(d.templateId), id);
      const cur = d.adjust[k] ?? { scale: 1, dx: 0, dy: 0 };
      return { ...d, adjust: { ...d.adjust, [k]: { ...cur, ...p } } };
    });
  }, []);

  const resetAdjust = useCallback((id: string) => {
    setDoc((d) => {
      const k = fieldKey(getTemplate(d.templateId), id);
      const next = { ...d.adjust };
      delete next[k];
      return { ...d, adjust: next };
    });
  }, []);

  const setPreset = useCallback(
    async (map: string, list: string[]) => {
      if (!map) return;
      const name = Object.keys(presets).find((k) => k.toLowerCase() === map.toLowerCase()) ?? map;
      const { error } = await supabase
        .from("poster_map_drops")
        .upsert({ map_name: name, drops: list, updated_at: new Date().toISOString() });
      if (error) {
        toastError(error.message);
        return;
      }
      setPresetsState((cur) => ({ ...cur, [name]: list }));
      toastSuccess(`${name} hot drops saved.`);
    },
    [presets, supabase],
  );

  /** Rebuild a ranked list from kills logged in Inners tournaments (other tournament types don't count). */
  const fillFromData = useCallback(
    async (kind: "kills") => {
      if (kind !== "kills") return;
      const { board, error } = await fetchInnersBoard(supabase);
      if (error) {
        toastError(error);
        return;
      }
      if (board.length === 0) {
        toastError("No Inners kills logged yet — record an Inners tournament first.");
        return;
      }
      setValue("rows", leaderboardRows(board));
      toastSuccess(`Filled ${Math.min(board.length, 24)} players from Inners tournaments.`);
    },
    [supabase, setValue],
  );

  /* ---------- uploads & library ---------- */

  const upload = useCallback(async (file: File) => {
    try {
      return await fileToDataUrl(file);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Upload failed.");
      return null;
    }
  }, []);

  const saveAsset = useCallback(
    (kind: "logos" | "backgrounds", src: string) => {
      const next = { ...assets, [kind]: [src, ...assets[kind].filter((s) => s !== src)].slice(0, 12) };
      if (!saveAssets(next)) {
        toastError("Browser storage is full — remove something from the library first.");
        return;
      }
      setAssets(next);
      toastSuccess("Saved to library.");
    },
    [assets],
  );

  const removeAsset = useCallback(
    (kind: "logos" | "backgrounds", src: string) => {
      const next = { ...assets, [kind]: assets[kind].filter((s) => s !== src) };
      saveAssets(next);
      setAssets(next);
    },
    [assets],
  );

  /* ---------- drafts ---------- */

  const saveDraft = useCallback(
    (name: string) => {
      const next = [{ id: crypto.randomUUID(), name, savedAt: new Date().toISOString(), doc }, ...drafts].slice(0, 20);
      if (!saveDrafts(next)) {
        toastError("Browser storage is full — delete an old saved poster or use smaller images.");
        return;
      }
      setDrafts(next);
      toastSuccess(`Saved “${name}”.`);
    },
    [doc, drafts],
  );

  const loadDraft = useCallback((d: Draft) => {
    setDoc(d.doc);
    setSelected(null);
  }, []);

  const deleteDraft = useCallback(
    (id: string) => {
      const next = drafts.filter((d) => d.id !== id);
      saveDrafts(next);
      setDrafts(next);
    },
    [drafts],
  );

  /* ---------- export ---------- */

  const exportOne = useCallback(
    async (type: ExportType, ratio: number) => {
      if (!posterRef.current) return;
      const { w, h } = FORMATS[doc.format];
      setBusy(true);
      setSelected(null);
      await sleep(80);
      try {
        const url = await renderPoster(posterRef.current, w, h, type, ratio);
        download(url, `genxio-${tpl.id}-${doc.format}.${type === "png" ? "png" : "jpg"}`);
        toastSuccess("Poster downloaded.");
      } catch (e) {
        console.error("Poster export failed", e);
        toastError(e instanceof Error ? e.message : "Couldn't render the poster.");
      }
      setBusy(false);
    },
    [doc.format, tpl.id],
  );

  const exportAll = useCallback((type: ExportType, ratio: number) => {
    setBusy(true);
    setSelected(null);
    setBatch({ type, ratio });
  }, []);

  useEffect(() => {
    if (!batch) return;
    let cancelled = false;
    (async () => {
      await sleep(400);
      try {
        for (const f of FORMAT_LIST) {
          const node = batchRefs.current[f.id];
          if (!node || cancelled) continue;
          const url = await renderPoster(node, f.w, f.h, batch.type, batch.ratio);
          download(url, `genxio-${doc.templateId}-${f.id}.${batch.type === "png" ? "png" : "jpg"}`);
          await sleep(250);
        }
        toastSuccess(`All ${FORMAT_LIST.length} sizes downloaded.`);
      } catch (e) {
        console.error("Batch export failed", e);
        toastError(e instanceof Error ? e.message : "Couldn't render the posters.");
      }
      setBatch(null);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [batch, doc.templateId]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-2.5">Announcements</div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text md:text-[30px]">Poster Studio</h1>
        </div>
        <p className="max-w-md text-[12px] text-text-dim">Pick a template, edit the text, drop in backgrounds and logos, then export PNG/JPG in feed, square or story size.</p>
      </div>

      <div className="grid min-h-[640px] overflow-hidden border border-line bg-panel/30 lg:h-[calc(100vh-200px)] lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="order-2 max-h-[560px] overflow-hidden border-t border-line lg:order-1 lg:max-h-none lg:border-r lg:border-t-0">
          <LeftPanel doc={doc} tpl={tpl} selected={selected} select={setSelected} setTemplate={setTemplate} setValue={setValue} setImage={setImage} toggleHidden={toggleHidden} upload={upload} presets={presets} setPreset={setPreset} onFill={fillFromData} />
        </aside>

        <div className="order-1 min-h-[460px] lg:order-2">
          <Canvas doc={doc} selected={selected} select={setSelected} setAdjust={setAdjust} innerRef={posterRef} />
        </div>

        <aside className="order-3 max-h-[560px] overflow-hidden border-t border-line lg:max-h-none lg:border-l lg:border-t-0">
          <RightPanel
            doc={doc}
            tpl={tpl}
            selected={selected}
            select={setSelected}
            assets={assets}
            drafts={drafts}
            busy={busy}
            setFormat={(f) => patch({ format: f })}
            setAccent={(c) => patch({ accent: c })}
            setBg={setBg}
            setAdjust={setAdjust}
            resetAdjust={resetAdjust}
            toggleHidden={toggleHidden}
            setImage={setImage}
            upload={upload}
            saveAsset={saveAsset}
            removeAsset={removeAsset}
            exportOne={exportOne}
            exportAll={exportAll}
            saveDraft={saveDraft}
            loadDraft={loadDraft}
            deleteDraft={deleteDraft}
          />
        </aside>
      </div>

      {/* off-screen renders used only for "download all sizes" */}
      {batch && (
        <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
          {FORMAT_LIST.map((f) => (
            <PosterView key={f.id} doc={{ ...doc, format: f.id }} innerRef={(el) => { batchRefs.current[f.id] = el; }} exporting />
          ))}
        </div>
      )}
    </div>
  );
}
