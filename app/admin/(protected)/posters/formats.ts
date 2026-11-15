import type { FormatDef, FormatId } from "./types";

export const FORMATS: Record<FormatId, FormatDef> = {
  portrait: { id: "portrait", label: "4:5", hint: "Feed portrait · 1080×1350", w: 1080, h: 1350 },
  tall: { id: "tall", label: "2:3", hint: "Tall poster · 1080×1620", w: 1080, h: 1620 },
  square: { id: "square", label: "1:1", hint: "Square · 1080×1080", w: 1080, h: 1080 },
  story: { id: "story", label: "9:16", hint: "Story · 1080×1920", w: 1080, h: 1920 },
};

export const FORMAT_LIST: FormatDef[] = [FORMATS.portrait, FORMATS.tall, FORMATS.square, FORMATS.story];
