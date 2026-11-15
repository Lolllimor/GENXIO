"use client";

import { createContext, useContext } from "react";
import type { Adjust, PosterDoc, TemplateDef } from "./types";

export const NO_ADJUST: Adjust = { scale: 1, dx: 0, dy: 0 };

export interface PosterCtx {
  doc: PosterDoc;
  tpl: TemplateDef;
  accent: string;
  selected: string | null;
  /** True while rendering for export: hides selection chrome. */
  exporting: boolean;
  /** Preview shows drag handles / selection. */
  interactive: boolean;
  /** Preview scale (poster px → screen px), used to convert drags. */
  scale: number;
  key: (id: string) => string;
  val: (id: string) => string;
  img: (id: string) => string | null;
  show: (section: string) => boolean;
  select: (id: string | null) => void;
  setAdjust: (id: string, patch: Partial<Adjust>) => void;
}

const Ctx = createContext<PosterCtx | null>(null);
export const PosterProvider = Ctx.Provider;

export function usePoster(): PosterCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePoster must be used inside a poster");
  return c;
}

/** Storage key for a field. Shared fields use their bare id so they survive template switches. */
export function fieldKey(tpl: TemplateDef, id: string) {
  const f = tpl.fields.find((x) => x.id === id);
  return f?.shared ? id : `${tpl.id}:${id}`;
}
