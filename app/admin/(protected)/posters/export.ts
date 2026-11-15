import { toJpeg, toPng } from "html-to-image";

const FONT_CSS_URL = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap";
let fontCss: Promise<string> | null = null;

// html-to-image can't read the cross-origin Google Fonts stylesheet, so inline it (fonts as data URLs) ourselves.
function loadFontCss(): Promise<string> {
  fontCss ??= (async () => {
    const css = await (await fetch(FONT_CSS_URL)).text();
    const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
    let out = css;
    for (const u of urls) {
      const blob = await (await fetch(u)).blob();
      const data = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(blob);
      });
      out = out.split(u).join(data);
    }
    return out;
  })();
  return fontCss;
}

export type ExportType = "png" | "jpeg";

export async function renderPoster(node: HTMLElement, w: number, h: number, type: ExportType, ratio: number): Promise<string> {
  const fontEmbedCSS = await loadFontCss().catch(() => "");
  const opts = { width: w, height: h, pixelRatio: ratio, fontEmbedCSS, backgroundColor: "#050507" };
  return type === "png" ? toPng(node, opts) : toJpeg(node, { ...opts, quality: 0.95 });
}

export function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
