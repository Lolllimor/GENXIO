"use client";

import type { Ref } from "react";
import { PosterProvider, fieldKey, type PosterCtx } from "./context";
import { FORMATS } from "./formats";
import { getTemplate } from "./templates/registry";
import type { Adjust, PosterDoc } from "./types";

const noop = () => {};

export default function PosterView({
  doc,
  innerRef,
  selected = null,
  exporting = false,
  interactive = false,
  scale = 1,
  select = noop,
  setAdjust = noop,
}: {
  doc: PosterDoc;
  innerRef?: Ref<HTMLDivElement>;
  selected?: string | null;
  exporting?: boolean;
  interactive?: boolean;
  scale?: number;
  select?: (id: string | null) => void;
  setAdjust?: (id: string, patch: Partial<Adjust>) => void;
}) {
  const tpl = getTemplate(doc.templateId);
  const { w, h } = FORMATS[doc.format];

  const ctx: PosterCtx = {
    doc,
    tpl,
    accent: doc.accent,
    selected,
    exporting,
    interactive,
    scale,
    key: (id) => fieldKey(tpl, id),
    val: (id) => doc.values[fieldKey(tpl, id)] ?? tpl.fields.find((f) => f.id === id)?.default ?? "",
    img: (id) => {
      const v = doc.images[fieldKey(tpl, id)];
      if (v !== undefined) return v;
      return tpl.fields.find((f) => f.id === id)?.default || null;
    },
    show: (section) => !doc.hidden[`sec:${tpl.id}:${section}`],
    select,
    setAdjust,
  };

  return (
    <PosterProvider value={ctx}>
      <div ref={innerRef} style={{ width: w, height: h }}>
        <tpl.Component />
      </div>
    </PosterProvider>
  );
}
