import type { PosterDoc } from "./types";

const ASSET_KEY = "genxio.posters.assets.v1";
const DRAFT_KEY = "genxio.posters.drafts.v1";

export interface Assets {
  logos: string[];
  backgrounds: string[];
}

export interface Draft {
  id: string;
  name: string;
  savedAt: string;
  doc: PosterDoc;
}

export const BUILTIN_BACKGROUNDS = [
  { id: "ruins", label: "Ruins", src: "/posters/bg-ruins.webp" },
  { id: "corridor", label: "Neon corridor", src: "/posters/bg-corridor.webp" },
  { id: "helicopter", label: "Insertion", src: "/posters/bg-helicopter.webp" },
  { id: "frame", label: "Tech frame", src: "/posters/bg-frame.webp" },
  { id: "hero", label: "Soldiers", src: "/hero-bg.webp" },
];

function read<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadAssets = (): Assets => read<Assets>(ASSET_KEY, { logos: [], backgrounds: [] });
export const saveAssets = (a: Assets) => write(ASSET_KEY, a);
export const loadDrafts = (): Draft[] => read<Draft[]>(DRAFT_KEY, []);
export const saveDrafts = (d: Draft[]) => write(DRAFT_KEY, d);

/** Read an upload, downscale it, and return a data URL. PNGs stay PNG so logos keep transparency. */
export function fileToDataUrl(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a readable image."));
      img.onload = () => {
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas isn't available."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const keepAlpha = file.type === "image/png" || file.type === "image/webp";
        resolve(keepAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

