"use client";

import { useState } from "react";
import { fieldKey } from "./context";
import { EyeButton, PanelSection, Segmented, Slider, Thumb, UploadButton } from "./controls";
import { FORMAT_LIST } from "./formats";
import { BUILTIN_BACKGROUNDS, type Assets, type Draft } from "./library";
import { ACCENTS } from "./theme";
import type { Adjust, BgState, FormatId, PosterDoc, TemplateDef } from "./types";
import type { ExportType } from "./export";

export default function RightPanel({
  doc, tpl, selected, select, assets, drafts, busy,
  setFormat, setAccent, setBg, setAdjust, resetAdjust, toggleHidden, setImage,
  upload, saveAsset, removeAsset, exportOne, exportAll, saveDraft, loadDraft, deleteDraft,
}: {
  doc: PosterDoc;
  tpl: TemplateDef;
  selected: string | null;
  select: (id: string | null) => void;
  assets: Assets;
  drafts: Draft[];
  busy: boolean;
  setFormat: (f: FormatId) => void;
  setAccent: (c: string) => void;
  setBg: (p: Partial<BgState>) => void;
  setAdjust: (id: string, patch: Partial<Adjust>) => void;
  resetAdjust: (id: string) => void;
  toggleHidden: (key: string) => void;
  setImage: (id: string, src: string | null) => void;
  upload: (file: File) => Promise<string | null>;
  saveAsset: (kind: "logos" | "backgrounds", src: string) => void;
  removeAsset: (kind: "logos" | "backgrounds", src: string) => void;
  exportOne: (type: ExportType, ratio: number) => void;
  exportAll: (type: ExportType, ratio: number) => void;
  saveDraft: (name: string) => void;
  loadDraft: (d: Draft) => void;
  deleteDraft: (id: string) => void;
}) {
  const [type, setType] = useState<ExportType>("png");
  const [ratio, setRatio] = useState(2);
  const [name, setName] = useState("");

  const sel = selected ? tpl.fields.find((f) => f.id === selected) : null;
  const selKey = sel ? fieldKey(tpl, sel.id) : "";
  const adj = (selKey && doc.adjust[selKey]) || { scale: 1, dx: 0, dy: 0 };

  const logoKey = "logo";
  const currentLogo = doc.images[logoKey] !== undefined ? doc.images[logoKey] : "/logo-clear.png";
  const bgIsCustom = doc.bg.src?.startsWith("data:") ?? false;
  const customSaved = doc.bg.src ? assets.backgrounds.includes(doc.bg.src) : false;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Canvas">
        <Segmented value={doc.format} onChange={setFormat} options={FORMAT_LIST.map((f) => ({ id: f.id, label: f.label, hint: f.hint }))} />
        <div className="mt-2 text-[10.5px] text-text-dim">{FORMAT_LIST.find((f) => f.id === doc.format)?.hint}</div>
      </PanelSection>

      <PanelSection title="Colour">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              onClick={() => setAccent(c)}
              className={`h-6 w-6 border ${doc.accent === c ? "border-white shadow-[0_0_10px_var(--purple)]" : "border-line"}`}
              style={{ background: c }}
            />
          ))}
          <input type="color" value={doc.accent} onChange={(e) => setAccent(e.target.value)} className="!h-6 !min-h-0 !w-8 !border-0 !bg-transparent !p-0" aria-label="Custom accent" />
        </div>
      </PanelSection>

      <PanelSection title="Background">
        <div className="mb-3 grid grid-cols-4 gap-2">
          <Thumb src="/posters/none.svg" label="No image" active={!doc.bg.src} onClick={() => setBg({ src: null })} />
          {BUILTIN_BACKGROUNDS.map((b) => (
            <Thumb key={b.id} src={b.src} label={b.label} active={doc.bg.src === b.src} onClick={() => setBg({ src: b.src })} />
          ))}
          {assets.backgrounds.map((b, i) => (
            <Thumb key={i} src={b} label="Saved" active={doc.bg.src === b} onClick={() => setBg({ src: b })} onRemove={() => removeAsset("backgrounds", b)} />
          ))}
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <UploadButton label="Upload" onFile={async (f) => { const u = await upload(f); if (u) setBg({ src: u }); }} />
          </div>
          {bgIsCustom && !customSaved && doc.bg.src && (
            <button type="button" className="btn btn-outline !px-3 !py-2 !text-[10.5px]" onClick={() => saveAsset("backgrounds", doc.bg.src!)}>
              Save to library
            </button>
          )}
        </div>
        <label className="mb-3 flex items-center gap-2 !normal-case">
          <input type="checkbox" checked={doc.bg.grayscale} onChange={(e) => setBg({ grayscale: e.target.checked })} className="!h-4 !min-h-0 !w-4 !p-0" />
          <span className="text-[11px] uppercase tracking-[0.1em] text-text-dim">Grayscale</span>
        </label>
        <Slider label="Darken" value={doc.bg.dim} min={0} max={0.85} step={0.01} onChange={(v) => setBg({ dim: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
        <Slider label="Zoom" value={doc.bg.zoom} min={1} max={2.5} step={0.01} onChange={(v) => setBg({ zoom: v })} fmt={(v) => `${v.toFixed(2)}×`} />
        <Slider label="Focus X" value={doc.bg.x} min={0} max={100} onChange={(v) => setBg({ x: v })} fmt={(v) => `${v}%`} />
        <Slider label="Focus Y" value={doc.bg.y} min={0} max={100} onChange={(v) => setBg({ y: v })} fmt={(v) => `${v}%`} />
      </PanelSection>

      <PanelSection title="Brand logo">
        <div className="mb-3 grid grid-cols-4 gap-2">
          <Thumb src="/logo-clear.png" label="GenXio" active={currentLogo === "/logo-clear.png"} onClick={() => setImage(logoKey, "/logo-clear.png")} />
          {assets.logos.map((l, i) => (
            <Thumb key={i} src={l} label="Saved logo" active={currentLogo === l} onClick={() => setImage(logoKey, l)} onRemove={() => removeAsset("logos", l)} />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <UploadButton label="Upload logo" onFile={async (f) => { const u = await upload(f); if (u) { setImage(logoKey, u); saveAsset("logos", u); } }} />
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Selected element">
        {sel ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-[12.5px] font-bold uppercase tracking-wide text-text">{sel.label}</span>
              <EyeButton hidden={!!doc.hidden[selKey]} onClick={() => toggleHidden(selKey)} label="Show / hide" />
            </div>
            <Slider label="Size" value={adj.scale} min={0.4} max={2.5} step={0.01} onChange={(v) => setAdjust(sel.id, { scale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="Move X" value={adj.dx} min={-600} max={600} onChange={(v) => setAdjust(sel.id, { dx: v })} fmt={(v) => `${v}px`} />
            <Slider label="Move Y" value={adj.dy} min={-600} max={600} onChange={(v) => setAdjust(sel.id, { dy: v })} fmt={(v) => `${v}px`} />
            <button type="button" className="text-[10.5px] uppercase tracking-wide text-text-dim hover:text-purple" onClick={() => resetAdjust(sel.id)}>
              Reset position &amp; size
            </button>
          </>
        ) : (
          <p className="text-[11.5px] leading-relaxed text-text-dim">Click any text or image on the poster (or in Layers below) to resize and reposition it. Drag it directly on the canvas.</p>
        )}
      </PanelSection>

      <PanelSection title="Layers">
        <ul className="space-y-0.5">
          {tpl.fields.map((f) => {
            const k = fieldKey(tpl, f.id);
            const off = !!doc.hidden[k];
            return (
              <li key={f.id} className={`flex items-center justify-between gap-2 px-2 py-1 ${selected === f.id ? "bg-purple/15" : "hover:bg-white/[0.03]"}`}>
                <button type="button" onClick={() => select(f.id)} className={`min-w-0 flex-1 truncate text-left text-[11.5px] ${off ? "text-text-dim/50 line-through" : "text-text"}`}>
                  <span className="mr-1.5 text-[9.5px] uppercase text-text-dim">{f.kind === "image" ? "img" : "txt"}</span>
                  {f.section ? `${tpl.sections.find((s) => s.id === f.section)?.label}: ` : ""}
                  {f.label}
                </button>
                <EyeButton hidden={off} onClick={() => toggleHidden(k)} label="Show / hide" />
              </li>
            );
          })}
        </ul>
      </PanelSection>

      <PanelSection title="Export">
        <div className="mb-3 grid gap-2">
          <Segmented value={type} onChange={setType} options={[{ id: "png", label: "PNG" }, { id: "jpeg", label: "JPG" }]} />
          <Segmented value={String(ratio) as "1" | "2" | "3"} onChange={(v) => setRatio(Number(v))} options={[{ id: "1", label: "1×" }, { id: "2", label: "2×" }, { id: "3", label: "3×" }]} />
        </div>
        <button type="button" disabled={busy} onClick={() => exportOne(type, ratio)} className="btn btn-primary mb-2 w-full">
          {busy ? "Rendering…" : "Download poster"}
        </button>
        <button type="button" disabled={busy} onClick={() => exportAll(type, ratio)} className="btn btn-outline w-full !py-2 !text-[10.5px]">
          Download all {FORMAT_LIST.length} sizes
        </button>
      </PanelSection>

      <PanelSection title="Saved posters">
        <div className="mb-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this poster" />
          <button type="button" className="btn btn-outline !px-3 !py-2 !text-[10.5px]" onClick={() => { saveDraft(name.trim() || "Untitled"); setName(""); }}>
            Save
          </button>
        </div>
        {drafts.length === 0 ? (
          <p className="text-[11.5px] text-text-dim">Nothing saved yet. Drafts stay in this browser.</p>
        ) : (
          <ul className="space-y-1">
            {drafts.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 border border-line px-2.5 py-1.5">
                <button type="button" onClick={() => loadDraft(d)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[12px] font-semibold text-text">{d.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-text-dim">{d.doc.templateId} · {new Date(d.savedAt).toLocaleDateString()}</div>
                </button>
                <button type="button" aria-label="Delete saved poster" onClick={() => deleteDraft(d.id)} className="text-text-dim hover:text-red">×</button>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}
