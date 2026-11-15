import type { ComponentType } from "react";

export type FormatId = "portrait" | "square" | "story";

export interface FormatDef {
  id: FormatId;
  label: string;
  hint: string;
  w: number;
  h: number;
}

export type FieldKind = "text" | "textarea" | "image" | "map" | "hotdrop";

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
  default: string;
  /** Section this field belongs to (can be toggled off as a block). */
  section?: string;
  /** Shared fields keep their value when switching templates (org, tagline, logo). */
  shared?: boolean;
}

export interface SectionDef {
  id: string;
  label: string;
  optional?: boolean;
}

export interface Adjust {
  scale: number;
  dx: number;
  dy: number;
}

export interface BgState {
  src: string | null;
  grayscale: boolean;
  /** 0–0.9 extra darkening. */
  dim: number;
  zoom: number;
  /** object-position, 0–100 */
  x: number;
  y: number;
}

/** Everything that defines one poster. Pure data — templates only read it. */
export interface PosterDoc {
  templateId: string;
  format: FormatId;
  accent: string;
  bg: BgState;
  values: Record<string, string>;
  /** undefined = use field default, null = explicitly none */
  images: Record<string, string | null>;
  hidden: Record<string, boolean>;
  adjust: Record<string, Adjust>;
}

export interface TemplateDef {
  id: string;
  name: string;
  blurb: string;
  defaultBg: string;
  /** Extra darkening applied with the default background (bright photos). */
  defaultDim?: number;
  sections: SectionDef[];
  fields: FieldDef[];
  Component: ComponentType;
}
