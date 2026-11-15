"use client";

import { useRef, useState } from "react";
import { fieldKey } from "./context";
import { EyeButton, PanelSection, UploadButton } from "./controls";
import { dropsFor, MAPS, type MapPresets } from "./maps";
import { UPCOMING, TEMPLATES } from "./templates/registry";
import type { FieldDef, PosterDoc, TemplateDef } from "./types";

function Chips({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={`admin-chip !px-2 !py-1 !text-[10px] ${o.toLowerCase() === value.trim().toLowerCase() ? "admin-chip-active" : ""}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function HotDropEditor({ mapName, list, onSave }: { mapName: string; list: string[]; onSave: (l: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-[10.5px] uppercase tracking-wide text-text-dim hover:text-purple"
        onClick={() => {
          setText(list.join("\n"));
          setOpen((o) => !o);
        }}
      >
        {open ? "Close list" : `Edit ${mapName || "map"} hot drops`}
      </button>
      {open && (
        <div className="mt-2">
          <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="One hot drop per line" />
          <button
            type="button"
            className="btn btn-outline mt-2 !px-3 !py-1.5 !text-[10px]"
            onClick={() => {
              onSave(text.split("\n").map((l) => l.trim()).filter(Boolean));
              setOpen(false);
            }}
          >
            Save list
          </button>
        </div>
      )}
    </div>
  );
}

function FieldRow({ f, tpl, doc, selected, onSelect, setValue, setImage, upload, presets, setPreset }: {
  f: FieldDef;
  tpl: TemplateDef;
  doc: PosterDoc;
  selected: string | null;
  onSelect: (id: string) => void;
  setValue: (id: string, v: string) => void;
  setImage: (id: string, src: string | null) => void;
  upload: (file: File) => Promise<string | null>;
  presets: MapPresets;
  setPreset: (map: string, list: string[]) => void;
}) {
  const key = fieldKey(tpl, f.id);
  const value = doc.values[key] ?? f.default;
  const img = doc.images[key] !== undefined ? doc.images[key] : f.default || null;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="mb-3" onFocusCapture={() => onSelect(f.id)}>
      <label className={selected === f.id ? "!text-purple" : ""}>{f.label}</label>
      {f.kind === "text" && <input value={value} onChange={(e) => setValue(f.id, e.target.value)} />}
      {f.kind === "map" && (
        <>
          <input value={value} onChange={(e) => setValue(f.id, e.target.value)} placeholder="Type any map" />
          <Chips options={MAPS} value={value} onPick={(v) => setValue(f.id, v)} />
        </>
      )}
      {f.kind === "hotdrop" && (() => {
        const mapField = tpl.fields.find((x) => x.kind === "map");
        const mapName = mapField ? doc.values[fieldKey(tpl, mapField.id)] ?? mapField.default : "";
        const list = dropsFor(presets, mapName);
        return (
          <>
            <input value={value} onChange={(e) => setValue(f.id, e.target.value)} placeholder="Type any hot drop" />
            {list.length > 0 ? (
              <Chips options={list} value={value} onPick={(v) => setValue(f.id, v)} />
            ) : (
              <p className="mt-2 text-[11px] text-text-dim">No saved hot drops for {mapName || "this map"} yet — type one, or add a list below.</p>
            )}
            <HotDropEditor key={mapName} mapName={mapName} list={list} onSave={(l) => setPreset(mapName.trim(), l)} />
          </>
        );
      })()}
      {f.kind === "textarea" && <textarea rows={2} value={value} onChange={(e) => setValue(f.id, e.target.value)} />}
      {f.kind === "image" && (
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-line bg-black">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] uppercase text-text-dim">None</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <UploadButton
              compact
              label={img ? "Replace" : "Upload"}
              onFile={async (file) => {
                const url = await upload(file);
                if (url) setImage(f.id, url);
              }}
            />
            {img && (
              <button type="button" onClick={() => setImage(f.id, null)} className="text-left text-[10.5px] uppercase tracking-wide text-text-dim hover:text-red">
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeftPanel({ doc, tpl, selected, select, setTemplate, setValue, setImage, toggleHidden, upload, presets, setPreset }: {
  doc: PosterDoc;
  tpl: TemplateDef;
  selected: string | null;
  select: (id: string | null) => void;
  setTemplate: (id: string) => void;
  setValue: (id: string, v: string) => void;
  setImage: (id: string, src: string | null) => void;
  toggleHidden: (key: string) => void;
  upload: (file: File) => Promise<string | null>;
  presets: MapPresets;
  setPreset: (map: string, list: string[]) => void;
}) {
  const loose = tpl.fields.filter((f) => !f.section);

  const row = (f: FieldDef) => (
    <FieldRow key={f.id} f={f} tpl={tpl} doc={doc} selected={selected} onSelect={select} setValue={setValue} setImage={setImage} upload={upload} presets={presets} setPreset={setPreset} />
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Template">
        <div className="flex flex-col gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`border px-3 py-2.5 text-left transition-colors [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] ${
                doc.templateId === t.id ? "border-purple bg-purple/10" : "border-line hover:border-text-dim"
              }`}
            >
              <div className={`font-display text-[12.5px] font-bold uppercase tracking-[0.08em] ${doc.templateId === t.id ? "text-purple" : "text-text"}`}>{t.name}</div>
              <div className="mt-0.5 text-[11px] text-text-dim">{t.blurb}</div>
            </button>
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-[10.5px] uppercase tracking-[0.12em] text-text-dim">Coming next ({UPCOMING.length})</summary>
          <ul className="mt-2 space-y-1 pl-1 text-[11.5px] text-text-dim">
            {UPCOMING.map((u) => (
              <li key={u}>· {u}</li>
            ))}
          </ul>
        </details>
      </PanelSection>

      <PanelSection title="Content">
        {loose.map(row)}
      </PanelSection>

      {tpl.sections.map((s) => {
        const hiddenKey = `sec:${tpl.id}:${s.id}`;
        const off = !!doc.hidden[hiddenKey];
        return (
          <PanelSection
            key={s.id}
            title={s.label}
            aside={s.optional ? <EyeButton hidden={off} onClick={() => toggleHidden(hiddenKey)} label={off ? "Show section" : "Hide section"} /> : undefined}
          >
            <div className={off ? "pointer-events-none opacity-35" : ""}>{tpl.fields.filter((f) => f.section === s.id).map(row)}</div>
          </PanelSection>
        );
      })}
    </div>
  );
}
