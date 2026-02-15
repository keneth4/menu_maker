import { computeCenteredContainPlacement } from "../../core/media/fit";

export const RESPONSIVE_IMAGE_WIDTHS = {
  small: 480,
  medium: 960,
  large: 1440
} as const;

export type ResponsiveMediaPaths = {
  small: string;
  medium: string;
  large: string;
};

export const toBase64 = (data: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < data.length; index += chunkSize) {
    const chunk = data.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

export const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const getMimeType = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";
  if (["png", "gif", "webp", "jpg", "jpeg", "svg"].includes(ext)) {
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  }
  if (ext === "ico") return "image/x-icon";
  if (["mp4", "webm"].includes(ext)) {
    return `video/${ext}`;
  }
  if (ext === "css") return "text/css";
  if (ext === "js") return "application/javascript";
  if (ext === "json") return "application/json";
  if (ext === "html") return "text/html";
  if (ext === "txt") return "text/plain";
  if (ext === "woff2") return "font/woff2";
  if (ext === "woff") return "font/woff";
  if (ext === "ttf") return "font/ttf";
  if (ext === "otf") return "font/otf";
  return "application/octet-stream";
};

export const isResponsiveImageMime = (mime: string) =>
  ["image/jpeg", "image/png"].includes(mime.toLowerCase());

export const withVariantSuffix = (path: string, suffix: string) => {
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  if (dot <= slash) return `${path}-${suffix}`;
  return `${path.slice(0, dot)}-${suffix}${path.slice(dot)}`;
};

export const createResponsiveImageVariants = async (
  basePath: string,
  sourceData: Uint8Array,
  mime: string
): Promise<{ paths: ResponsiveMediaPaths; entries: { name: string; data: Uint8Array }[] } | null> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([sourceData], { type: mime }));
  } catch {
    return null;
  }

  const longestEdge = Math.max(bitmap.width, bitmap.height);
  const specs = [
    { key: "large", suffix: "lg", maxEdge: RESPONSIVE_IMAGE_WIDTHS.large },
    { key: "medium", suffix: "md", maxEdge: RESPONSIVE_IMAGE_WIDTHS.medium },
    { key: "small", suffix: "sm", maxEdge: RESPONSIVE_IMAGE_WIDTHS.small }
  ] as const;

  const variantByEdge = new Map<number, { path: string; data: Uint8Array }>();
  const paths: ResponsiveMediaPaths = { small: "", medium: "", large: "" };

  for (const spec of specs) {
    const targetEdge = Math.min(longestEdge, spec.maxEdge);
    const existing = variantByEdge.get(targetEdge);
    if (existing) {
      paths[spec.key] = existing.path;
      continue;
    }
    let nextData = sourceData;
    if (targetEdge < longestEdge) {
      const scale = targetEdge / Math.max(1, longestEdge);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        return null;
      }
      const contain = computeCenteredContainPlacement(bitmap.width, bitmap.height, width, height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, contain.dx, contain.dy, contain.dw, contain.dh);
      const quality = mime === "image/png" ? undefined : 0.86;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
      if (!blob) {
        bitmap.close();
        return null;
      }
      const buffer = await blob.arrayBuffer();
      nextData = new Uint8Array(buffer);
    }
    const variantPath = withVariantSuffix(basePath, spec.suffix);
    variantByEdge.set(targetEdge, { path: variantPath, data: nextData });
    paths[spec.key] = variantPath;
  }

  bitmap.close();
  const entries = Array.from(variantByEdge.values()).map((entry) => ({
    name: entry.path,
    data: entry.data
  }));
  return { paths, entries };
};
