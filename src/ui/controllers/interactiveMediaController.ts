import type { MenuItem } from "../../lib/types";

export type InteractiveDetailAsset = {
  source: string;
  mime: "image/gif" | "image/webp";
};

type InteractiveMediaControllerOptions = {
  debugInteractiveCenter?: boolean;
  rotateCueReshowIdleMs?: number;
  rotateCueLoopMs?: number;
  keepOriginalPlacement?: boolean;
  maxFrames?: number;
};

type RenderSpec = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

const INTERACTIVE_CENTER_SAMPLE_TARGET = 6;

export type InteractiveMediaController = {
  setMediaHost: (host: HTMLDivElement | null) => void;
  setMediaImage: (image: HTMLImageElement | null) => void;
  setRotateDirection: (direction: 1 | -1) => void;
  getInteractiveAssetMime: (source?: string | null) => InteractiveDetailAsset["mime"] | null;
  getInteractiveDetailAsset: (item: MenuItem | null) => InteractiveDetailAsset | null;
  supportsInteractiveMedia: () => boolean;
  prefetchInteractiveBytes: (source: string) => Promise<ArrayBuffer | null>;
  setup: (asset: InteractiveDetailAsset | null) => Promise<void>;
  teardown: () => void;
};

const decodeMaybe = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readForegroundCenterFromBitmap = (bitmap: ImageBitmap) => {
  const maxSize = 140;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const alphaThreshold = 16;

  const readAlphaBounds = () => {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] <= alphaThreshold) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0 || maxY < 0) return null;
    return { minX, minY, maxX, maxY };
  };

  let r = 0;
  let g = 0;
  let b = 0;
  let r2 = 0;
  let g2 = 0;
  let b2 = 0;
  let samples = 0;
  const sampleEdge = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    if (data[idx + 3] <= alphaThreshold) return;
    const rv = data[idx];
    const gv = data[idx + 1];
    const bv = data[idx + 2];
    r += rv;
    g += gv;
    b += bv;
    r2 += rv * rv;
    g2 += gv * gv;
    b2 += bv * bv;
    samples += 1;
  };
  for (let x = 0; x < width; x += 1) {
    sampleEdge(x, 0);
    if (height > 1) sampleEdge(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    sampleEdge(0, y);
    if (width > 1) sampleEdge(width - 1, y);
  }
  if (samples === 0) {
    const bounds = readAlphaBounds();
    if (!bounds) return null;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const invScale = scale > 0 ? 1 / scale : 1;
    return {
      center: { x: centerX * invScale, y: centerY * invScale },
      bounds: {
        minX: bounds.minX * invScale,
        minY: bounds.minY * invScale,
        maxX: bounds.maxX * invScale,
        maxY: bounds.maxY * invScale
      }
    };
  }
  const meanR = r / samples;
  const meanG = g / samples;
  const meanB = b / samples;
  const varR = Math.max(0, r2 / samples - meanR * meanR);
  const varG = Math.max(0, g2 / samples - meanG * meanG);
  const varB = Math.max(0, b2 / samples - meanB * meanB);
  const colorStd = Math.sqrt(varR + varG + varB);
  const threshold = Math.max(12, Math.min(60, colorStd * 2.6 + 10));
  const thresholdSq = threshold * threshold;

  const isBackground = (idx: number) => {
    if (data[idx + 3] <= alphaThreshold) return true;
    const dr = data[idx] - meanR;
    const dg = data[idx + 1] - meanG;
    const db = data[idx + 2] - meanB;
    return dr * dr + dg * dg + db * db <= thresholdSq;
  };

  const pixelTotal = width * height;
  const visited = new Uint8Array(pixelTotal);
  const queue: number[] = [];
  const pushIfBackground = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (!isBackground(idx * 4)) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    if (height > 1) pushIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    if (width > 1) pushIfBackground(width - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop() ?? 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);
  let foregroundTotal = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      const dataIdx = idx * 4;
      if (data[dataIdx + 3] <= alphaThreshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      rowCounts[y] += 1;
      colCounts[x] += 1;
      foregroundTotal += 1;
    }
  }

  if (maxX < 0 || maxY < 0) {
    const bounds = readAlphaBounds();
    if (!bounds) return null;
    minX = bounds.minX;
    minY = bounds.minY;
    maxX = bounds.maxX;
    maxY = bounds.maxY;
  } else if (foregroundTotal > 0) {
    const trimCount = Math.max(1, Math.round(foregroundTotal * 0.01));
    const findMinIndex = (counts: Uint32Array) => {
      let acc = 0;
      for (let i = 0; i < counts.length; i += 1) {
        acc += counts[i];
        if (acc >= trimCount) return i;
      }
      return 0;
    };
    const findMaxIndex = (counts: Uint32Array) => {
      let acc = 0;
      for (let i = counts.length - 1; i >= 0; i -= 1) {
        acc += counts[i];
        if (acc >= trimCount) return i;
      }
      return counts.length - 1;
    };
    const trimmedMinY = findMinIndex(rowCounts);
    const trimmedMaxY = findMaxIndex(rowCounts);
    const trimmedMinX = findMinIndex(colCounts);
    const trimmedMaxX = findMaxIndex(colCounts);
    const baseW = maxX - minX;
    const baseH = maxY - minY;
    const trimmedW = trimmedMaxX - trimmedMinX;
    const trimmedH = trimmedMaxY - trimmedMinY;
    if (trimmedW > baseW * 0.4 && trimmedH > baseH * 0.4) {
      minX = Math.min(Math.max(trimmedMinX, 0), width - 1);
      maxX = Math.min(Math.max(trimmedMaxX, minX), width - 1);
      minY = Math.min(Math.max(trimmedMinY, 0), height - 1);
      maxY = Math.min(Math.max(trimmedMaxY, minY), height - 1);
    }
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const invScale = scale > 0 ? 1 / scale : 1;
  return {
    center: { x: centerX * invScale, y: centerY * invScale },
    bounds: {
      minX: minX * invScale,
      minY: minY * invScale,
      maxX: maxX * invScale,
      maxY: maxY * invScale
    }
  };
};

const readCenterOffsetFromBitmaps = (bitmaps: ImageBitmap[]) => {
  if (!bitmaps.length) return null;
  const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
  const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
  const centers: { x: number; y: number }[] = [];
  for (let index = 0; index < bitmaps.length && centers.length < sampleTarget; index += step) {
    const info = readForegroundCenterFromBitmap(bitmaps[index]);
    if (info) centers.push(info.center);
  }
  if (!centers.length) return null;
  const xs = centers.map((center) => center.x).sort((a, b) => a - b);
  const ys = centers.map((center) => center.y).sort((a, b) => a - b);
  const medianX = xs[Math.floor(xs.length / 2)];
  const medianY = ys[Math.floor(ys.length / 2)];
  const width = bitmaps[0].width;
  const height = bitmaps[0].height;
  return {
    x: Math.round(width / 2 - medianX),
    y: Math.round(height / 2 - medianY)
  };
};

const readContentBoundsFromBitmaps = (bitmaps: ImageBitmap[]) => {
  if (!bitmaps.length) return null;
  const sampleTarget = Math.min(INTERACTIVE_CENTER_SAMPLE_TARGET, bitmaps.length);
  const step = Math.max(1, Math.floor(bitmaps.length / sampleTarget));
  const boundsList: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
  for (let index = 0; index < bitmaps.length && boundsList.length < sampleTarget; index += step) {
    const info = readForegroundCenterFromBitmap(bitmaps[index]);
    if (info) boundsList.push(info.bounds);
  }
  if (!boundsList.length) return null;
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const minX = median(boundsList.map((b) => b.minX));
  const minY = median(boundsList.map((b) => b.minY));
  const maxX = median(boundsList.map((b) => b.maxX));
  const maxY = median(boundsList.map((b) => b.maxY));
  return { minX, minY, maxX, maxY };
};

export const createInteractiveMediaController = (
  options: InteractiveMediaControllerOptions = {}
): InteractiveMediaController => {
  const debugInteractiveCenter = options.debugInteractiveCenter ?? false;
  const rotateCueReshowIdleMs = options.rotateCueReshowIdleMs ?? 3000;
  const rotateCueLoopMs = options.rotateCueLoopMs ?? 5000;
  const keepOriginalPlacement = options.keepOriginalPlacement ?? true;
  const maxFrames = options.maxFrames ?? 72;

  let mediaHost: HTMLDivElement | null = null;
  let mediaImage: HTMLImageElement | null = null;
  let rotateDirection: 1 | -1 = -1;
  let cleanupCurrent: (() => void) | null = null;
  let mediaToken = 0;
  let pendingAsset: InteractiveDetailAsset | null = null;

  const interactiveBytesCache = new Map<string, ArrayBuffer>();
  const interactiveBytesPending = new Map<string, Promise<ArrayBuffer | null>>();
  const interactiveCenterOffsetCache = new Map<string, { x: number; y: number }>();

  const setMediaHost = (host: HTMLDivElement | null) => {
    mediaHost = host;
    if (pendingAsset && mediaHost && mediaImage) {
      const asset = pendingAsset;
      pendingAsset = null;
      void setup(asset);
    }
  };

  const setMediaImage = (image: HTMLImageElement | null) => {
    mediaImage = image;
    if (pendingAsset && mediaHost && mediaImage) {
      const asset = pendingAsset;
      pendingAsset = null;
      void setup(asset);
    }
  };

  const setRotateDirection = (direction: 1 | -1) => {
    rotateDirection = direction;
  };

  const getInteractiveAssetMime = (source?: string | null): InteractiveDetailAsset["mime"] | null => {
    if (!source) return null;
    const normalizedSource = decodeMaybe(source.trim()).toLowerCase();
    if (normalizedSource.startsWith("data:image/gif")) return "image/gif";
    if (normalizedSource.startsWith("data:image/webp")) return "image/webp";

    const candidates = [normalizedSource];
    try {
      const url = new URL(source, window.location.href);
      const encodedPath = url.searchParams.get("path");
      if (encodedPath) {
        candidates.push(decodeMaybe(encodedPath).toLowerCase());
      }
    } catch {
      // Ignore malformed URLs; raw candidate already included.
    }
    for (const candidate of candidates) {
      if (/\.gif(?:$|[?#&])/i.test(candidate)) return "image/gif";
      if (/\.webp(?:$|[?#&])/i.test(candidate)) return "image/webp";
    }
    return null;
  };

  const getInteractiveDetailAsset = (item: MenuItem | null): InteractiveDetailAsset | null => {
    if (!item) return null;
    const candidates = [
      item.media.hero360,
      item.media.originalHero360,
      item.media.responsive?.large,
      item.media.responsive?.medium,
      item.media.responsive?.small
    ];
    for (const candidate of candidates) {
      const source = (candidate || "").trim();
      if (!source) continue;
      const mime = getInteractiveAssetMime(source);
      if (mime) {
        return { source, mime };
      }
    }
    return null;
  };

  const supportsInteractiveMedia = () =>
    typeof window !== "undefined" && "ImageDecoder" in window;

  const prefetchInteractiveBytes = async (source: string) => {
    const cached = interactiveBytesCache.get(source);
    if (cached) return cached;
    const pending = interactiveBytesPending.get(source);
    if (pending) return pending;
    const task = (async () => {
      try {
        const response = await fetch(source, { cache: "force-cache" });
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        interactiveBytesCache.set(source, bytes);
        return bytes;
      } catch {
        return null;
      } finally {
        interactiveBytesPending.delete(source);
      }
    })();
    interactiveBytesPending.set(source, task);
    return task;
  };

  const teardown = () => {
    mediaToken += 1;
    pendingAsset = null;
    if (cleanupCurrent) {
      cleanupCurrent();
      cleanupCurrent = null;
    }
  };

  const setup = async (asset: InteractiveDetailAsset | null) => {
    teardown();
    if (!asset) return;
    pendingAsset = asset;
    if (!mediaHost || !mediaImage) return;
    pendingAsset = null;
    const Decoder = (window as Window & { ImageDecoder?: new (init: unknown) => any }).ImageDecoder;
    if (!Decoder) return;

    const token = ++mediaToken;
    const host = mediaHost;
    const image = mediaImage;
    const debugEnabled = debugInteractiveCenter;
    let debugEl: HTMLDivElement | null = null;
    let debugBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let debugVisibleRect: { x: number; y: number; width: number; height: number } | null = null;
    let debugFrameSize: { width: number; height: number } | null = null;
    const abortController = new AbortController();
    let disposed = false;
    let decoder: any = null;
    const bitmaps: ImageBitmap[] = [];
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let canvasDisplayWidth = 0;
    let canvasDisplayHeight = 0;
    let resizeObserver: ResizeObserver | null = null;
    let detachWindowPointerEvents: (() => void) | null = null;
    let pointerId: number | null = null;
    let lastX = 0;
    let frameCursor = 0;
    let interactiveReady = false;
    let imageHidden = false;
    const allowAutoCenter = !keepOriginalPlacement;
    let centerOffset = allowAutoCenter
      ? interactiveCenterOffsetCache.get(asset.source) ?? { x: 0, y: 0 }
      : { x: 0, y: 0 };
    let contentBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
    let renderSpec: RenderSpec | null = null;
    const cueElement = host.querySelector<HTMLDivElement>(".dish-modal__rotate-cue");
    let cueIdleTimeout: ReturnType<typeof setTimeout> | null = null;
    const clearCueTimers = () => {
      if (cueIdleTimeout) {
        window.clearTimeout(cueIdleTimeout);
        cueIdleTimeout = null;
      }
    };
    const restartCueLoop = () => {
      if (!cueElement) return;
      cueElement.style.setProperty("--rotate-cue-loop-ms", `${rotateCueLoopMs}ms`);
      cueElement.classList.remove("is-looping");
      void cueElement.offsetWidth;
      cueElement.classList.add("is-looping");
    };
    const setCueState = (state: "visible" | "hidden") => {
      host.dataset.cueState = state;
      if (state === "visible") {
        restartCueLoop();
      }
    };
    const scheduleCueVisible = () => {
      if (disposed) return;
      if (cueIdleTimeout) {
        window.clearTimeout(cueIdleTimeout);
      }
      cueIdleTimeout = window.setTimeout(() => {
        cueIdleTimeout = null;
        if (disposed) return;
        setCueState("visible");
      }, rotateCueReshowIdleMs);
    };

    host.classList.add("is-loading-interactive");
    setCueState("visible");
    if (debugEnabled) {
      debugEl = document.createElement("div");
      debugEl.className = "dish-modal__media-debug";
      host.appendChild(debugEl);
    }
    const hideImage = () => {
      if (imageHidden) return;
      imageHidden = true;
      image.classList.add("is-hidden");
    };
    const updateDebugOverlay = () => {
      if (!debugEnabled || !debugEl) return;
      const frameLabel = canvas ? `${canvas.width}x${canvas.height}` : "-";
      const offsetLabel = `${Math.round(centerOffset.x)}, ${Math.round(centerOffset.y)}`;
      const boundsLabel = debugBounds
        ? `${Math.round(debugBounds.minX)},${Math.round(debugBounds.minY)} ${Math.round(
            debugBounds.maxX - debugBounds.minX
          )}x${Math.round(debugBounds.maxY - debugBounds.minY)}`
        : "-";
      const visibleLabel = debugVisibleRect
        ? `${Math.round(debugVisibleRect.x)},${Math.round(debugVisibleRect.y)} ${Math.round(
            debugVisibleRect.width
          )}x${Math.round(debugVisibleRect.height)}`
        : "-";
      const frameSizeLabel = debugFrameSize
        ? `${Math.round(debugFrameSize.width)}x${Math.round(debugFrameSize.height)}`
        : "-";
      debugEl.textContent = `offset: ${offsetLabel}\nframe: ${frameLabel}\nsource: ${frameSizeLabel}\nvisible: ${visibleLabel}\nbounds: ${boundsLabel}`;
    };

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      abortController.abort();
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (detachWindowPointerEvents) {
        detachWindowPointerEvents();
        detachWindowPointerEvents = null;
      }
      if (canvas) {
        canvas.remove();
      }
      if (debugEl) {
        debugEl.remove();
        debugEl = null;
      }
      if (imageHidden) {
        image.classList.remove("is-hidden");
      }
      clearCueTimers();
      cueElement?.classList.remove("is-looping");
      delete host.dataset.cueState;
      host.classList.remove("is-loading-interactive");
      host.classList.remove("is-interactive");
      bitmaps.forEach((bitmap) => bitmap.close());
      bitmaps.length = 0;
      try {
        decoder?.close?.();
      } catch {
        // Ignore decoder close errors.
      }
    };

    cleanupCurrent = cleanup;

    try {
      const bytes = await prefetchInteractiveBytes(asset.source);
      if (!bytes) {
        cleanup();
        return;
      }
      if (disposed || token !== mediaToken) {
        cleanup();
        return;
      }

      decoder = new Decoder({ data: bytes, type: asset.mime });
      await decoder.tracks.ready;
      const frameCount = Number(decoder.tracks?.selectedTrack?.frameCount ?? 0);
      if (frameCount < 2) {
        cleanup();
        return;
      }
      const frameStep = Math.max(1, Math.ceil(frameCount / maxFrames));
      const decodeIndices: number[] = [];
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += frameStep) {
        decodeIndices.push(frameIndex);
      }
      if (decodeIndices[decodeIndices.length - 1] !== frameCount - 1) {
        decodeIndices.push(frameCount - 1);
      }

      const pixelsPerFrame = window.matchMedia("(pointer: coarse)").matches ? 7 : 4;
      const computeRenderSpec = () => {
        if (!canvas || !contentBounds) return null;
        const dpr = window.devicePixelRatio || 1;
        const width = canvasDisplayWidth || canvas.width / dpr;
        const height = canvasDisplayHeight || canvas.height / dpr;
        const boundsW = Math.max(1, contentBounds.maxX - contentBounds.minX);
        const boundsH = Math.max(1, contentBounds.maxY - contentBounds.minY);
        const padding = Math.max(boundsW, boundsH) * 0.08;
        let sx = contentBounds.minX - padding;
        let sy = contentBounds.minY - padding;
        let sw = boundsW + padding * 2;
        let sh = boundsH + padding * 2;

        sx = Math.max(0, Math.min(sx, width - 1));
        sy = Math.max(0, Math.min(sy, height - 1));
        sw = Math.max(1, Math.min(sw, width));
        sh = Math.max(1, Math.min(sh, height));
        if (sx + sw > width) {
          sx = Math.max(0, width - sw);
        }
        if (sy + sh > height) {
          sy = Math.max(0, height - sh);
        }

        const scale = Math.min(width / sw, height / sh);
        const dw = sw * scale;
        const dh = sh * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;
        return { sx, sy, sw, sh, dx, dy, dw, dh };
      };

      const render = () => {
        if (!canvas || !ctx || disposed) return;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvasDisplayWidth || canvas.width / dpr;
        const displayHeight = canvasDisplayHeight || canvas.height / dpr;
        const frameCountSafe = Math.max(1, bitmaps.length);
        const normalized =
          ((Math.round(frameCursor) % frameCountSafe) + frameCountSafe) % frameCountSafe;
        const frame = bitmaps[normalized];
        if (!frame) return;
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        let containScale = 1;
        let containDx = 0;
        let containDy = 0;
        if (renderSpec) {
          ctx.drawImage(
            frame,
            renderSpec.sx,
            renderSpec.sy,
            renderSpec.sw,
            renderSpec.sh,
            renderSpec.dx,
            renderSpec.dy,
            renderSpec.dw,
            renderSpec.dh
          );
        } else {
          containScale = Math.min(displayWidth / frame.width, displayHeight / frame.height);
          const dw = frame.width * containScale;
          const dh = frame.height * containScale;
          containDx = (displayWidth - dw) / 2;
          containDy = (displayHeight - dh) / 2;
          ctx.drawImage(frame, containDx, containDy, dw, dh);
        }
        if (debugEnabled && debugBounds) {
          let rectX = debugBounds.minX + centerOffset.x;
          let rectY = debugBounds.minY + centerOffset.y;
          let rectW = debugBounds.maxX - debugBounds.minX;
          let rectH = debugBounds.maxY - debugBounds.minY;
          if (renderSpec) {
            const scaleX = renderSpec.dw / renderSpec.sw;
            const scaleY = renderSpec.dh / renderSpec.sh;
            rectX = renderSpec.dx + (debugBounds.minX - renderSpec.sx) * scaleX;
            rectY = renderSpec.dy + (debugBounds.minY - renderSpec.sy) * scaleY;
            rectW = (debugBounds.maxX - debugBounds.minX) * scaleX;
            rectH = (debugBounds.maxY - debugBounds.minY) * scaleY;
          } else {
            rectX = containDx + debugBounds.minX * containScale;
            rectY = containDy + debugBounds.minY * containScale;
            rectW = (debugBounds.maxX - debugBounds.minX) * containScale;
            rectH = (debugBounds.maxY - debugBounds.minY) * containScale;
          }
          const centerX = displayWidth / 2;
          const centerY = displayHeight / 2;
          const boundsCenterX = rectX + rectW / 2;
          const boundsCenterY = rectY + rectH / 2;
          ctx.save();
          ctx.strokeStyle = "rgba(248, 250, 252, 0.7)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX - 12, centerY);
          ctx.lineTo(centerX + 12, centerY);
          ctx.moveTo(centerX, centerY - 12);
          ctx.lineTo(centerX, centerY + 12);
          ctx.stroke();
          ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
          ctx.lineWidth = 2;
          ctx.strokeRect(rectX, rectY, rectW, rectH);
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
          ctx.beginPath();
          ctx.arc(boundsCenterX, boundsCenterY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        updateDebugOverlay();
      };

      const ensureCanvas = (firstBitmap: ImageBitmap) => {
        if (canvas || disposed) return;
        if (allowAutoCenter) {
          const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
          if (computedOffset) {
            centerOffset = computedOffset;
            interactiveCenterOffsetCache.set(asset.source, centerOffset);
          }
        }
        canvas = document.createElement("canvas");
        canvas.className = "dish-modal__media-canvas";
        canvas.width = firstBitmap.width;
        canvas.height = firstBitmap.height;
        ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return;
        }
        if (allowAutoCenter && contentBounds) {
          renderSpec = computeRenderSpec();
        }
        const onPointerDown = (event: PointerEvent) => {
          pointerId = event.pointerId;
          lastX = event.clientX;
          clearCueTimers();
          setCueState("hidden");
          scheduleCueVisible();
          try {
            canvas?.setPointerCapture(pointerId);
          } catch {
            // Pointer capture may fail on synthetic/non-primary events.
          }
          canvas?.classList.add("is-dragging");
          event.preventDefault();
        };
        const onPointerMove = (event: PointerEvent) => {
          if (pointerId !== event.pointerId) return;
          const deltaX = event.clientX - lastX;
          lastX = event.clientX;
          setCueState("hidden");
          scheduleCueVisible();
          frameCursor += (deltaX / pixelsPerFrame) * rotateDirection;
          render();
          event.preventDefault();
        };
        const onPointerRelease = (event: PointerEvent) => {
          if (pointerId === null) return;
          try {
            canvas?.releasePointerCapture(pointerId);
          } catch {
            // Ignore pointer capture release errors.
          }
          pointerId = null;
          canvas?.classList.remove("is-dragging");
          setCueState("hidden");
          scheduleCueVisible();
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerRelease);
        canvas.addEventListener("pointercancel", onPointerRelease);
        window.addEventListener("pointerup", onPointerRelease);
        window.addEventListener("pointercancel", onPointerRelease);
        detachWindowPointerEvents = () => {
          window.removeEventListener("pointerup", onPointerRelease);
          window.removeEventListener("pointercancel", onPointerRelease);
        };
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        canvas.addEventListener("dragstart", (event) => event.preventDefault());

        host.appendChild(canvas);
        const syncCanvasToImage = () => {
          if (!canvas || !ctx) return;
          const imageRect = image.getBoundingClientRect();
          const hostRect = host.getBoundingClientRect();
          const width = imageRect.width;
          const height = imageRect.height;
          if (!width || !height) {
            requestAnimationFrame(syncCanvasToImage);
            return;
          }
          canvasDisplayWidth = width;
          canvasDisplayHeight = height;
          canvas.style.position = "absolute";
          canvas.style.left = imageRect.left - hostRect.left + "px";
          canvas.style.top = imageRect.top - hostRect.top + "px";
          canvas.style.width = width + "px";
          canvas.style.height = height + "px";
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.max(1, Math.round(width * dpr));
          canvas.height = Math.max(1, Math.round(height * dpr));
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        syncCanvasToImage();
        requestAnimationFrame(syncCanvasToImage);
        if (!resizeObserver && "ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(() => {
            syncCanvasToImage();
            render();
          });
          resizeObserver.observe(host);
        }
        hideImage();
        host.classList.remove("is-loading-interactive");
      };

      let decodedCount = 0;
      const normalizeDecodedFrame = async (frame: VideoFrame) => {
        if (debugEnabled && !debugFrameSize) {
          debugFrameSize = {
            width: frame.codedWidth || frame.displayWidth || frame.visibleRect?.width || 0,
            height: frame.codedHeight || frame.displayHeight || frame.visibleRect?.height || 0
          };
        }
        const visibleRect = frame.visibleRect;
        if (debugEnabled && !debugVisibleRect && visibleRect) {
          debugVisibleRect = {
            x: visibleRect.x,
            y: visibleRect.y,
            width: visibleRect.width,
            height: visibleRect.height
          };
        }
        return createImageBitmap(frame);
      };

      for (const frameIndex of decodeIndices) {
        const decoded = await decoder.decode({ frameIndex, completeFramesOnly: true });
        const frame = decoded?.image;
        if (!frame) continue;
        const bitmap = await normalizeDecodedFrame(frame);
        frame.close?.();
        if (disposed || token !== mediaToken) {
          bitmap.close();
          cleanup();
          return;
        }
        bitmaps.push(bitmap);
        if (debugEnabled && !debugBounds) {
          const info = readForegroundCenterFromBitmap(bitmap);
          if (info) debugBounds = info.bounds;
        }
        if (
          allowAutoCenter &&
          (bitmaps.length === 1 || bitmaps.length === INTERACTIVE_CENTER_SAMPLE_TARGET)
        ) {
          const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
          if (computedOffset) {
            const delta =
              Math.abs(computedOffset.x - centerOffset.x) +
              Math.abs(computedOffset.y - centerOffset.y);
            if (delta > 1) {
              centerOffset = computedOffset;
              interactiveCenterOffsetCache.set(asset.source, centerOffset);
            }
          }
          const computedBounds = readContentBoundsFromBitmaps(bitmaps);
          if (computedBounds) {
            contentBounds = computedBounds;
            renderSpec = computeRenderSpec();
            if (debugEnabled) {
              debugBounds = computedBounds;
            }
          }
        }
        if (!canvas) {
          ensureCanvas(bitmap);
        }
        render();
        if (!interactiveReady && bitmaps.length >= 2) {
          interactiveReady = true;
          host.classList.add("is-interactive");
        }
        decodedCount += 1;
        if (decodedCount % 6 === 0) {
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }
      }

      if (!canvas) {
        cleanup();
        return;
      }
      if (allowAutoCenter) {
        const computedOffset = readCenterOffsetFromBitmaps(bitmaps);
        if (computedOffset) {
          centerOffset = computedOffset;
          interactiveCenterOffsetCache.set(asset.source, centerOffset);
          render();
        }
        const computedBounds = readContentBoundsFromBitmaps(bitmaps);
        if (computedBounds) {
          contentBounds = computedBounds;
          renderSpec = computeRenderSpec();
          if (debugEnabled) {
            debugBounds = computedBounds;
          }
          render();
        }
      }
      if (!interactiveReady && bitmaps.length >= 2) {
        interactiveReady = true;
        host.classList.add("is-interactive");
      }
    } catch (error) {
      const isAbort =
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError");
      if (!isAbort) {
        console.warn("Interactive GIF decode failed", asset.source, error);
      }
      cleanup();
    }
  };

  return {
    setMediaHost,
    setMediaImage,
    setRotateDirection,
    getInteractiveAssetMime,
    getInteractiveDetailAsset,
    supportsInteractiveMedia,
    prefetchInteractiveBytes,
    setup,
    teardown
  };
};
