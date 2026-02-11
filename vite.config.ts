import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { MenuItem, MediaAsset, MenuProject } from "./src/lib/types";
import { normalizeProjectSlug } from "./src/infrastructure/bridge/pathing";

export default defineConfig({
  server: {
    allowedHosts: ["menumaker-dev"]
  },
  plugins: [
    svelte(),
    {
      name: "asset-bridge",
      configureServer(server) {
        const root = path.resolve(process.cwd(), "public", "projects");
        const indexPath = path.resolve(root, "index.json");
        const readOnlyAssetProjects = new Set(["sample-cafebrunch-menu", "demo"]);
        const ensureProjectRoot = async (project: string) => {
          const base = path.resolve(root, project, "assets");
          await fs.mkdir(base, { recursive: true });
          await fs.mkdir(path.resolve(base, "originals", "backgrounds"), { recursive: true });
          await fs.mkdir(path.resolve(base, "originals", "items"), { recursive: true });
          await fs.mkdir(path.resolve(base, "originals", "fonts"), { recursive: true });
          await fs.mkdir(path.resolve(base, "derived", "backgrounds"), { recursive: true });
          await fs.mkdir(path.resolve(base, "derived", "items"), { recursive: true });
          return base;
        };
        const sanitizeSlug = (value: string) => normalizeProjectSlug(value);
        const mapLegacyAssetRelative = (value: string) => {
          const normalized = value.replace(/^\/+/, "");
          if (normalized.startsWith("fonts/") || normalized === "fonts") {
            return `originals/fonts${normalized.slice("fonts".length)}`;
          }
          return normalized;
        };
        const resolveAssetPath = async (project: string, targetPath: string) => {
          const base = await ensureProjectRoot(project);
          const safePath = mapLegacyAssetRelative(targetPath);
          const full = path.resolve(base, safePath);
          if (!full.startsWith(base)) {
            throw new Error("Invalid path");
          }
          return { base, full, relative: safePath };
        };
        const readJson = async (req: any) => {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }
          const raw = Buffer.concat(chunks).toString();
          return raw ? JSON.parse(raw) : {};
        };
        const listEntries = async (dir: string, prefix = ""): Promise<{ path: string; kind: string }[]> => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const results: { path: string; kind: string }[] = [];
          for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            const rel = path.join(prefix, entry.name);
            if (entry.isDirectory()) {
              results.push({ path: rel, kind: "directory" });
              results.push(...(await listEntries(entryPath, rel)));
            } else {
              results.push({ path: rel, kind: "file" });
            }
          }
          return results;
        };
        const movePath = async (from: string, to: string) => {
          await fs.mkdir(path.dirname(to), { recursive: true });
          try {
            await fs.rename(from, to);
          } catch {
            await fs.cp(from, to, { recursive: true });
            await fs.rm(from, { recursive: true, force: true });
          }
        };
        const seedAssets = async (project: string, fromProject = "sample-cafebrunch-menu") => {
          const source = path.resolve(root, fromProject, "assets");
          const destination = await ensureProjectRoot(project);
          try {
            await fs.cp(source, destination, { recursive: true, force: false, errorOnExist: false });
          } catch {
            await fs.cp(source, destination, { recursive: true, force: true });
          }
        };
        const readIndex = async () => {
          try {
            const raw = await fs.readFile(indexPath, "utf-8");
            const data = JSON.parse(raw) as { projects?: any[] };
            return { projects: data.projects ?? [] };
          } catch {
            return { projects: [] };
          }
        };
        const writeIndex = async (data: { projects: any[] }) => {
          await fs.mkdir(root, { recursive: true });
          await fs.writeFile(indexPath, JSON.stringify(data, null, 2));
        };
        const decodeMaybe = (value: string) => {
          try {
            return decodeURIComponent(value);
          } catch {
            return value;
          }
        };
        const toAssetRelativePath = (sourcePath: string, projectSlug: string) => {
          const raw = String(sourcePath || "").trim();
          if (!raw) return "";
          const clean = decodeMaybe(raw.split(/[?#]/, 1)[0]).replace(/\\/g, "/").replace(/^\/+/, "");
          const projectPrefix = `projects/${projectSlug}/assets/`;
          if (clean.startsWith(projectPrefix)) {
            return clean.slice(projectPrefix.length);
          }
          const anyProjectMatch = clean.match(/^projects\/[^/]+\/assets\/(.+)$/);
          if (anyProjectMatch) {
            return anyProjectMatch[1];
          }
          if (clean.startsWith("assets/")) {
            return mapLegacyAssetRelative(clean.slice("assets/".length));
          }
          return mapLegacyAssetRelative(clean);
        };
        const toPublicAssetPath = (projectSlug: string, relativePath: string) =>
          `/projects/${projectSlug}/assets/${relativePath.replace(/^\/+/, "")}`;
        const resolveExistingAssetSource = async (projectSlug: string, sourcePath: string) => {
          const relative = toAssetRelativePath(sourcePath, projectSlug);
          if (!relative) return null;
          try {
            const { full } = await resolveAssetPath(projectSlug, relative);
            await fs.access(full);
            return { full, relative };
          } catch {
            return null;
          }
        };
        const hashString = (value: string) => {
          let hash = 0;
          for (let index = 0; index < value.length; index += 1) {
            hash = (hash * 31 + value.charCodeAt(index)) | 0;
          }
          return Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6);
        };
        const sanitizeAssetStem = (relativePath: string, fallbackPrefix: string) => {
          const extension = path.posix.extname(relativePath);
          const rawStem = path.posix.basename(relativePath, extension);
          const baseStem =
            rawStem
              .toLowerCase()
              .replace(/[^a-z0-9._-]+/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-+|-+$/g, "") || fallbackPrefix;
          return `${baseStem}-${hashString(relativePath)}`;
        };
        const parsedCommandTimeoutMs = Number(process.env.FFMPEG_COMMAND_TIMEOUT_MS ?? "300000");
        const COMMAND_TIMEOUT_MS =
          Number.isFinite(parsedCommandTimeoutMs) && parsedCommandTimeoutMs > 0
            ? Math.max(30000, Math.round(parsedCommandTimeoutMs))
            : 300000;
        const ITEM_DERIVED_SCALE = 2 / 3;
        const BACKGROUND_DERIVED_SCALE = 2 / 3;
        const DERIVED_FALLBACK_PROFILE_ID = "ffmpeg-v2-copy-fallback";
        const BACKGROUND_DERIVED_PROFILE_ID = "ffmpeg-v7-background-2of3-animated-webp";
        const BACKGROUND_DERIVED_GIF_PROFILE_ID = "ffmpeg-v8-background-2of3-animated-gif";
        const ITEM_DERIVED_PROFILE_ID = "ffmpeg-v11-item-2of3-animated-webp-detail-original";
        const ITEM_DERIVED_GIF_PROFILE_ID = "ffmpeg-v12-item-2of3-animated-gif-detail-original";
        const FFMPEG_TOLERANT_INPUT_ARGS = ["-fflags", "+discardcorrupt", "-err_detect", "ignore_err"];
        const buildUniformScaleFilter = (ratio: number) =>
          `scale=max(2\\,trunc(iw*${ratio}/2)*2):max(2\\,trunc(ih*${ratio}/2)*2):flags=lanczos`;
        const runCommand = async (
          command: string,
          args: string[],
          options: { timeoutMs?: number } = {}
        ) =>
          await new Promise<void>((resolve, reject) => {
            const timeoutMs = options.timeoutMs ?? COMMAND_TIMEOUT_MS;
            const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
            let stdout = "";
            let stderr = "";
            let timedOut = false;
            let settled = false;
            const settle = (fn: () => void) => {
              if (settled) return;
              settled = true;
              fn();
            };
            const timeout =
              timeoutMs > 0
                ? setTimeout(() => {
                    timedOut = true;
                    child.kill("SIGKILL");
                  }, timeoutMs)
                : null;
            child.stdout.on("data", (chunk) => {
              stdout += String(chunk);
            });
            child.stderr.on("data", (chunk) => {
              stderr += String(chunk);
            });
            child.on("error", (error) => {
              if (timeout) clearTimeout(timeout);
              settle(() => reject(error));
            });
            child.on("close", (code) => {
              if (timeout) clearTimeout(timeout);
              if (timedOut) {
                settle(() => reject(new Error(`${command} timed out after ${timeoutMs}ms`)));
                return;
              }
              if (code === 0) {
                settle(() => resolve());
                return;
              }
              const details = (stderr.trim() || stdout.trim() || "no command output").slice(0, 2000);
              settle(() =>
                reject(new Error(`${command} exited with code ${code}: ${details}`))
              );
            });
          });
        const isOutputStale = async (sourceFull: string, outputFull: string) => {
          try {
            const [sourceStat, outputStat] = await Promise.all([fs.stat(sourceFull), fs.stat(outputFull)]);
            return outputStat.size === 0 || outputStat.mtimeMs < sourceStat.mtimeMs;
          } catch {
            return true;
          }
        };
        const areOutputsFresh = async (sourceFull: string, outputs: string[]) => {
          if (!outputs.length) return false;
          for (const outputFull of outputs) {
            if (await isOutputStale(sourceFull, outputFull)) {
              return false;
            }
          }
          return true;
        };
        const normalizeExtension = (value: string) => {
          const ext = value.toLowerCase();
          return ext.startsWith(".") ? ext : `.${ext}`;
        };
        const extensionToDerivedFormat = (extension: string) => {
          const key = normalizeExtension(extension).slice(1);
          if (["webp", "gif", "png", "jpg", "jpeg", "webm", "mp4"].includes(key)) {
            return key;
          }
          return null;
        };
        const buildDerivedVariant = (publicPath: string, extension: string) => {
          const format = extensionToDerivedFormat(extension);
          if (!format) return publicPath;
          return { [format]: publicPath };
        };
        const DERIVED_VARIANT_EXTENSIONS = [".webp", ".gif", ".png", ".jpg", ".jpeg", ".webm", ".mp4"];
        const removeStaleDerivedVariants = async (
          projectSlug: string,
          folder: "backgrounds" | "items",
          stem: string,
          keepRelative: string
        ) => {
          for (const ext of DERIVED_VARIANT_EXTENSIONS) {
            const candidateRelative = `derived/${folder}/${stem}-md${ext}`;
            if (candidateRelative === keepRelative) continue;
            try {
              const { full } = await resolveAssetPath(projectSlug, candidateRelative);
              await fs.rm(full, { force: true });
            } catch {
              // Ignore cleanup failures; generation should continue.
            }
          }
        };
        const resolveDerivedRelative = async (
          projectSlug: string,
          value?: string | Record<string, string | undefined>,
          preferredFormats: string[] = ["webp", "gif", "png", "jpg", "jpeg", "webm", "mp4"]
        ) => {
          if (!value) return null;
          const candidates: string[] = [];
          if (typeof value === "string") {
            candidates.push(value);
          } else {
            preferredFormats.forEach((format) => {
              const source = value[format];
              if (source) candidates.push(source);
            });
            Object.values(value).forEach((source) => {
              if (source && !candidates.includes(source)) {
                candidates.push(source);
              }
            });
          }
          for (const candidate of candidates) {
            const existing = await resolveExistingAssetSource(projectSlug, candidate);
            if (existing) return existing.relative;
          }
          return null;
        };
        let ffmpegAvailable: boolean | null = null;
        let ffmpegWebpEncoderAvailable: boolean | null = null;
        const ensureFfmpegAvailable = async () => {
          if (ffmpegAvailable !== null) return ffmpegAvailable;
          try {
            await runCommand("ffmpeg", ["-version"]);
            ffmpegAvailable = true;
          } catch {
            ffmpegAvailable = false;
          }
          return ffmpegAvailable;
        };
        const ensureFfmpegWebpEncoderAvailable = async () => {
          if (ffmpegWebpEncoderAvailable !== null) return ffmpegWebpEncoderAvailable;
          const hasFfmpeg = await ensureFfmpegAvailable();
          if (!hasFfmpeg) {
            ffmpegWebpEncoderAvailable = false;
            return false;
          }
          try {
            await runCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-h", "encoder=libwebp"], {
              timeoutMs: 20000
            });
            ffmpegWebpEncoderAvailable = true;
          } catch {
            ffmpegWebpEncoderAvailable = false;
          }
          return ffmpegWebpEncoderAvailable;
        };
        const ensureCopiedOriginal = async (
          projectSlug: string,
          sourceFull: string,
          sourceRelative: string,
          targetRelative: string
        ) => {
          const { full: targetFull } = await resolveAssetPath(projectSlug, targetRelative);
          await fs.mkdir(path.dirname(targetFull), { recursive: true });
          if (sourceRelative !== targetRelative && (await isOutputStale(sourceFull, targetFull))) {
            await fs.copyFile(sourceFull, targetFull);
          }
          return toPublicAssetPath(projectSlug, targetRelative);
        };
        const ensureCopiedDerivativeFallback = async (sourceFull: string, outputFull: string) => {
          await fs.mkdir(path.dirname(outputFull), { recursive: true });
          if (await isOutputStale(sourceFull, outputFull)) {
            await fs.copyFile(sourceFull, outputFull);
          }
        };
        const buildTolerantInputArgs = (sourceFull: string) => [
          ...FFMPEG_TOLERANT_INPUT_ARGS,
          "-i",
          sourceFull
        ];
        const ensureAnimatedWebpDerivative = async (
          sourceFull: string,
          outputFull: string,
          filter: string
        ) => {
          if (!(await isOutputStale(sourceFull, outputFull))) {
            return false;
          }
          await fs.mkdir(path.dirname(outputFull), { recursive: true });
          await runCommand("ffmpeg", [
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            ...buildTolerantInputArgs(sourceFull),
            "-vf",
            filter,
            "-an",
            "-c:v",
            "libwebp",
            "-quality",
            "78",
            "-compression_level",
            "4",
            "-loop",
            "0",
            outputFull
          ]);
          return true;
        };
        const ensureAnimatedGifDerivative = async (
          sourceFull: string,
          outputFull: string,
          filter: string
        ) => {
          if (!(await isOutputStale(sourceFull, outputFull))) {
            return false;
          }
          await fs.mkdir(path.dirname(outputFull), { recursive: true });
          await runCommand("ffmpeg", [
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            ...buildTolerantInputArgs(sourceFull),
            "-filter_complex",
            `${filter},split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=single[p];[b][p]paletteuse=dither=sierra2_4a:alpha_threshold=128`,
            "-gifflags",
            "+transdiff",
            "-loop",
            "0",
            outputFull
          ]);
          return true;
        };
        const buildFallbackBackgroundAsset = async (
          projectSlug: string,
          background: MediaAsset,
          index: number
        ) => {
          const sourceRef = background.originalSrc || background.src;
          if (!sourceRef) return background;
          const source = await resolveExistingAssetSource(projectSlug, sourceRef);
          if (!source) return background;
          const extension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const sourceIsOriginal = source.relative.startsWith("originals/backgrounds/");
          const stem = sourceIsOriginal
            ? path.posix.basename(source.relative, extension)
            : sanitizeAssetStem(source.relative, `background-${index + 1}`);
          const originalRelative = sourceIsOriginal
            ? source.relative
            : `originals/backgrounds/${stem}${extension}`;
          const canEncodeWebp = await ensureFfmpegWebpEncoderAvailable();
          const sourceExtension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const preferGif = sourceExtension === ".gif" || !canEncodeWebp;
          const previewFilter = buildUniformScaleFilter(BACKGROUND_DERIVED_SCALE);
          let previewExt = preferGif ? ".gif" : ".webp";
          let previewRelative = `derived/backgrounds/${stem}-md${previewExt}`;
          let profileId = preferGif
            ? BACKGROUND_DERIVED_GIF_PROFILE_ID
            : BACKGROUND_DERIVED_PROFILE_ID;
          const { full: previewAnimatedFull } = await resolveAssetPath(projectSlug, previewRelative);
          const originalPublic = await ensureCopiedOriginal(
            projectSlug,
            source.full,
            source.relative,
            originalRelative
          );
          try {
            if (preferGif) {
              await ensureAnimatedGifDerivative(source.full, previewAnimatedFull, previewFilter);
            } else {
              await ensureAnimatedWebpDerivative(source.full, previewAnimatedFull, previewFilter);
            }
          } catch {
            try {
              previewExt = ".gif";
              previewRelative = `derived/backgrounds/${stem}-md${previewExt}`;
              profileId = BACKGROUND_DERIVED_GIF_PROFILE_ID;
              const { full: previewGifFull } = await resolveAssetPath(projectSlug, previewRelative);
              await ensureAnimatedGifDerivative(source.full, previewGifFull, previewFilter);
            } catch {
              previewRelative = `derived/backgrounds/${stem}-md${extension}`;
              previewExt = extension;
              profileId = DERIVED_FALLBACK_PROFILE_ID;
              const { full: previewCopyFull } = await resolveAssetPath(projectSlug, previewRelative);
              await ensureCopiedDerivativeFallback(source.full, previewCopyFull);
            }
          }
          await removeStaleDerivedVariants(projectSlug, "backgrounds", stem, previewRelative);
          const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
          return {
            ...background,
            src: previewPublic,
            originalSrc: originalPublic,
            derived: {
              profileId,
              medium: buildDerivedVariant(previewPublic, previewExt),
              large: buildDerivedVariant(previewPublic, previewExt)
            }
          };
        };
        const buildFallbackDishAsset = async (projectSlug: string, item: MenuItem, index: number) => {
          const sourceRef = item.media.originalHero360 || item.media.hero360;
          if (!sourceRef) return item;
          const source = await resolveExistingAssetSource(projectSlug, sourceRef);
          if (!source) return item;
          const extension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const sourceIsOriginal = source.relative.startsWith("originals/items/");
          const stem = sourceIsOriginal
            ? path.posix.basename(source.relative, extension)
            : sanitizeAssetStem(source.relative, `dish-${index + 1}`);
          const originalRelative = sourceIsOriginal
            ? source.relative
            : `originals/items/${stem}${extension}`;
          const canEncodeWebp = await ensureFfmpegWebpEncoderAvailable();
          const sourceExtension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const preferGif = sourceExtension === ".gif" || !canEncodeWebp;
          const previewFilter = buildUniformScaleFilter(ITEM_DERIVED_SCALE);
          let previewExt = preferGif ? ".gif" : ".webp";
          let previewRelative = `derived/items/${stem}-md${previewExt}`;
          let profileId = preferGif ? ITEM_DERIVED_GIF_PROFILE_ID : ITEM_DERIVED_PROFILE_ID;
          const { full: previewAnimatedFull } = await resolveAssetPath(projectSlug, previewRelative);
          const originalPublic = await ensureCopiedOriginal(
            projectSlug,
            source.full,
            source.relative,
            originalRelative
          );
          try {
            if (preferGif) {
              await ensureAnimatedGifDerivative(source.full, previewAnimatedFull, previewFilter);
            } else {
              await ensureAnimatedWebpDerivative(source.full, previewAnimatedFull, previewFilter);
            }
          } catch {
            try {
              previewExt = ".gif";
              previewRelative = `derived/items/${stem}-md${previewExt}`;
              profileId = ITEM_DERIVED_GIF_PROFILE_ID;
              const { full: previewGifFull } = await resolveAssetPath(projectSlug, previewRelative);
              await ensureAnimatedGifDerivative(source.full, previewGifFull, previewFilter);
            } catch {
              previewRelative = `derived/items/${stem}-md${extension}`;
              previewExt = extension;
              profileId = DERIVED_FALLBACK_PROFILE_ID;
              const { full: previewCopyFull } = await resolveAssetPath(projectSlug, previewRelative);
              await ensureCopiedDerivativeFallback(source.full, previewCopyFull);
            }
          }
          await removeStaleDerivedVariants(projectSlug, "items", stem, previewRelative);
          const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
          return {
            ...item,
            media: {
              ...item.media,
              hero360: previewPublic,
              originalHero360: originalPublic,
              responsive: {
                small: previewPublic,
                medium: previewPublic,
                large: previewPublic
              },
              derived: {
                profileId,
                medium: buildDerivedVariant(previewPublic, previewExt),
                large: buildDerivedVariant(previewPublic, previewExt)
              }
            }
          };
        };
        const deriveBackgroundAsset = async (
          projectSlug: string,
          background: MediaAsset,
          index: number
        ) => {
          const existingOriginalRelative = background.originalSrc
            ? (await resolveExistingAssetSource(projectSlug, background.originalSrc))?.relative ?? null
            : null;
          const existingMediumRelative = await resolveDerivedRelative(
            projectSlug,
            background.derived?.medium as string | Record<string, string | undefined> | undefined
          );
          const existingLargeRelative = await resolveDerivedRelative(
            projectSlug,
            background.derived?.large as string | Record<string, string | undefined> | undefined
          );
          const existingPreviewRelative = existingMediumRelative ?? existingLargeRelative;
          const existingProfileId = background.derived?.profileId ?? "";
          const canEncodeWebp = await ensureFfmpegWebpEncoderAvailable();
          const sourceRef = background.originalSrc || background.src;
          if (!sourceRef) return background;
          const source = await resolveExistingAssetSource(projectSlug, sourceRef);
          if (!source) return background;
          const sourceExtension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const preferGif = sourceExtension === ".gif" || !canEncodeWebp;
          const targetProfileId = preferGif
            ? BACKGROUND_DERIVED_GIF_PROFILE_ID
            : BACKGROUND_DERIVED_PROFILE_ID;
          const canReuseExistingSet = existingProfileId === targetProfileId;
          if (canReuseExistingSet && existingOriginalRelative && existingPreviewRelative) {
            const { full: existingOriginalFull } = await resolveAssetPath(
              projectSlug,
              existingOriginalRelative
            );
            const { full: existingPreviewFull } = await resolveAssetPath(
              projectSlug,
              existingPreviewRelative
            );
            if (await areOutputsFresh(existingOriginalFull, [existingPreviewFull])) {
              const existingPreviewExt = normalizeExtension(
                path.posix.extname(existingPreviewRelative) || ".webp"
              );
              const previewPublic = toPublicAssetPath(projectSlug, existingPreviewRelative);
              return {
                ...background,
                src: previewPublic,
                originalSrc: toPublicAssetPath(projectSlug, existingOriginalRelative),
                derived: {
                  profileId: targetProfileId,
                  medium: buildDerivedVariant(previewPublic, existingPreviewExt),
                  large: buildDerivedVariant(previewPublic, existingPreviewExt)
                }
              };
            }
          }
          const extension = path.posix.extname(source.relative) || ".gif";
          const sourceIsOriginal = source.relative.startsWith("originals/backgrounds/");
          const stem = sourceIsOriginal
            ? path.posix.basename(source.relative, extension)
            : sanitizeAssetStem(source.relative, `background-${index + 1}`);
          const originalRelative = sourceIsOriginal
            ? source.relative
            : `originals/backgrounds/${stem}${extension}`;
          const previewExt = preferGif ? ".gif" : ".webp";
          const previewRelative = `derived/backgrounds/${stem}-md${previewExt}`;
          const { full: previewFull } = await resolveAssetPath(projectSlug, previewRelative);
          const { full: originalFull } = await resolveAssetPath(projectSlug, originalRelative);
          const reusableProfile = background.derived?.profileId === targetProfileId;
          if (reusableProfile && (await areOutputsFresh(originalFull, [previewFull]))) {
            const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
            return {
              ...background,
              src: previewPublic,
              originalSrc: toPublicAssetPath(projectSlug, originalRelative),
              derived: {
                profileId: targetProfileId,
                medium: buildDerivedVariant(previewPublic, previewExt),
                large: buildDerivedVariant(previewPublic, previewExt)
              }
            };
          }
          const originalPublic = await ensureCopiedOriginal(
            projectSlug,
            source.full,
            source.relative,
            originalRelative
          );
          const filter = buildUniformScaleFilter(BACKGROUND_DERIVED_SCALE);
          if (preferGif) {
            await ensureAnimatedGifDerivative(source.full, previewFull, filter);
          } else {
            await ensureAnimatedWebpDerivative(source.full, previewFull, filter);
          }
          await removeStaleDerivedVariants(projectSlug, "backgrounds", stem, previewRelative);
          const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
          return {
            ...background,
            src: previewPublic,
            originalSrc: originalPublic,
            derived: {
              profileId: targetProfileId,
              medium: buildDerivedVariant(previewPublic, previewExt),
              large: buildDerivedVariant(previewPublic, previewExt)
            }
          };
        };
        const deriveDishAsset = async (projectSlug: string, item: MenuItem, index: number) => {
          const existingOriginalRelative = item.media.originalHero360
            ? (await resolveExistingAssetSource(projectSlug, item.media.originalHero360))?.relative ?? null
            : null;
          const existingMediumRelative = await resolveDerivedRelative(
            projectSlug,
            item.media.derived?.medium as string | Record<string, string | undefined> | undefined,
            ["webp", "gif", "png", "jpg", "jpeg", "webm", "mp4"]
          );
          const existingLargeRelative = await resolveDerivedRelative(
            projectSlug,
            item.media.derived?.large as string | Record<string, string | undefined> | undefined,
            ["gif", "webp", "png", "jpg", "jpeg", "webm", "mp4"]
          );
          const existingPreviewRelative = existingMediumRelative ?? existingLargeRelative;
          const existingProfileId = item.media.derived?.profileId ?? "";
          const canEncodeWebp = await ensureFfmpegWebpEncoderAvailable();
          const sourceRef = item.media.originalHero360 || item.media.hero360;
          if (!sourceRef) return item;
          const source = await resolveExistingAssetSource(projectSlug, sourceRef);
          if (!source) return item;
          const sourceExtension = normalizeExtension(path.posix.extname(source.relative) || ".gif");
          const preferGif = sourceExtension === ".gif" || !canEncodeWebp;
          const targetProfileId = preferGif ? ITEM_DERIVED_GIF_PROFILE_ID : ITEM_DERIVED_PROFILE_ID;
          const canReuseExistingSet = existingProfileId === targetProfileId;
          if (canReuseExistingSet && existingOriginalRelative && existingPreviewRelative) {
            const { full: existingOriginalFull } = await resolveAssetPath(
              projectSlug,
              existingOriginalRelative
            );
            const { full: existingPreviewFull } = await resolveAssetPath(
              projectSlug,
              existingPreviewRelative
            );
            if (await areOutputsFresh(existingOriginalFull, [existingPreviewFull])) {
              const existingPreviewExt = normalizeExtension(
                path.posix.extname(existingPreviewRelative) || ".webp"
              );
              const previewPublic = toPublicAssetPath(projectSlug, existingPreviewRelative);
              return {
                ...item,
                media: {
                  ...item.media,
                  hero360: previewPublic,
                  originalHero360: toPublicAssetPath(projectSlug, existingOriginalRelative),
                  responsive: {
                    small: previewPublic,
                    medium: previewPublic,
                    large: previewPublic
                  },
                  derived: {
                    profileId: targetProfileId,
                    medium: buildDerivedVariant(previewPublic, existingPreviewExt),
                    large: buildDerivedVariant(previewPublic, existingPreviewExt)
                  }
                }
              };
            }
          }
          const extension = path.posix.extname(source.relative) || ".gif";
          const sourceIsOriginal = source.relative.startsWith("originals/items/");
          const stem = sourceIsOriginal
            ? path.posix.basename(source.relative, extension)
            : sanitizeAssetStem(source.relative, `dish-${index + 1}`);
          const originalRelative = sourceIsOriginal
            ? source.relative
            : `originals/items/${stem}${extension}`;
          const previewExt = preferGif ? ".gif" : ".webp";
          const previewRelative = `derived/items/${stem}-md${previewExt}`;
          const previewFilter = buildUniformScaleFilter(ITEM_DERIVED_SCALE);
          const { full: previewFull } = await resolveAssetPath(projectSlug, previewRelative);
          const { full: originalFull } = await resolveAssetPath(projectSlug, originalRelative);
          const reusableProfile = item.media.derived?.profileId === targetProfileId;
          if (reusableProfile && (await areOutputsFresh(originalFull, [previewFull]))) {
            const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
            return {
              ...item,
              media: {
                ...item.media,
                hero360: previewPublic,
                originalHero360: toPublicAssetPath(projectSlug, originalRelative),
                responsive: {
                  small: previewPublic,
                  medium: previewPublic,
                  large: previewPublic
                },
                derived: {
                  profileId: targetProfileId,
                  medium: buildDerivedVariant(previewPublic, previewExt),
                  large: buildDerivedVariant(previewPublic, previewExt)
                }
              }
            };
          }
          const originalPublic = await ensureCopiedOriginal(
            projectSlug,
            source.full,
            source.relative,
            originalRelative
          );
          if (preferGif) {
            await ensureAnimatedGifDerivative(source.full, previewFull, previewFilter);
          } else {
            await ensureAnimatedWebpDerivative(source.full, previewFull, previewFilter);
          }
          await removeStaleDerivedVariants(projectSlug, "items", stem, previewRelative);
          const previewPublic = toPublicAssetPath(projectSlug, previewRelative);
          return {
            ...item,
            media: {
              ...item.media,
              hero360: previewPublic,
              originalHero360: originalPublic,
              responsive: {
                small: previewPublic,
                medium: previewPublic,
                large: previewPublic
              },
              derived: {
                profileId: targetProfileId,
                medium: buildDerivedVariant(previewPublic, previewExt),
                large: buildDerivedVariant(previewPublic, previewExt)
              }
            }
          };
        };
        const prepareProjectDerivedAssets = async (projectSlug: string, sourceProject: MenuProject) => {
          const prepared = JSON.parse(JSON.stringify(sourceProject)) as MenuProject;
          const nextBackgrounds: MediaAsset[] = [];
          for (let index = 0; index < prepared.backgrounds.length; index += 1) {
            const background = prepared.backgrounds[index];
            try {
              nextBackgrounds.push(await deriveBackgroundAsset(projectSlug, background, index));
            } catch (error) {
              const sourceRef = background.originalSrc || background.src || `background-${index + 1}`;
              console.warn(`[prepare-derived] background derive failed for "${sourceRef}"`, error);
              try {
                nextBackgrounds.push(await buildFallbackBackgroundAsset(projectSlug, background, index));
              } catch (fallbackError) {
                console.warn(
                  `[prepare-derived] background fallback failed for "${sourceRef}"`,
                  fallbackError
                );
                nextBackgrounds.push(background);
              }
            }
          }
          prepared.backgrounds = nextBackgrounds;
          const nextCategories = prepared.categories.map((category) => ({ ...category, items: [] as MenuItem[] }));
          for (let categoryIndex = 0; categoryIndex < prepared.categories.length; categoryIndex += 1) {
            const category = prepared.categories[categoryIndex];
            const nextItems: MenuItem[] = [];
            for (let index = 0; index < category.items.length; index += 1) {
              const item = category.items[index];
              try {
                nextItems.push(await deriveDishAsset(projectSlug, item, index));
              } catch (error) {
                const sourceRef = item.media.originalHero360 || item.media.hero360 || `item-${index + 1}`;
                console.warn(`[prepare-derived] dish derive failed for "${sourceRef}"`, error);
                try {
                  nextItems.push(await buildFallbackDishAsset(projectSlug, item, index));
                } catch (fallbackError) {
                  console.warn(`[prepare-derived] dish fallback failed for "${sourceRef}"`, fallbackError);
                  nextItems.push(item);
                }
              }
            }
            nextCategories[categoryIndex].items = nextItems;
          }
          prepared.categories = nextCategories;
          return prepared;
        };

        server.middlewares.use("/api/assets", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const pathname = url.pathname.replace(/^\/api\/assets/, "");
            const project = url.searchParams.get("project") || "nuevo-proyecto";
            const safeProject = sanitizeSlug(project || "nuevo-proyecto") || "nuevo-proyecto";
            const isReadOnlyProject = readOnlyAssetProjects.has(safeProject);
            const denyReadOnlyMutation = () => {
              res.statusCode = 403;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error:
                    "This demo asset project is read-only. Create a new project folder to upload or edit assets."
                })
              );
            };
            if (req.method === "GET" && pathname === "/ping") {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "GET" && pathname === "/list") {
              const base = await ensureProjectRoot(safeProject);
              const entries = await listEntries(base);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ entries }));
              return;
            }
            if (req.method === "GET" && pathname === "/file") {
              const assetPath = url.searchParams.get("path") || "";
              const { full } = await resolveAssetPath(safeProject, assetPath);
              const data = await fs.readFile(full);
              res.setHeader("Content-Type", "application/octet-stream");
              res.end(data);
              return;
            }
            if (req.method === "POST" && pathname === "/upload") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const targetPath = body.path ?? "";
              const name = body.name ?? "asset";
              const dataUrl = body.data ?? "";
              const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
              const buffer = Buffer.from(base64, "base64");
              const { full } = await resolveAssetPath(safeProject, path.join(targetPath, name));
              await fs.mkdir(path.dirname(full), { recursive: true });
              await fs.writeFile(full, buffer);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/delete") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const { full } = await resolveAssetPath(safeProject, body.path ?? "");
              await fs.rm(full, { recursive: true, force: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/mkdir") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const { full } = await resolveAssetPath(safeProject, body.path ?? "");
              await fs.mkdir(full, { recursive: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/move") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const fromPath = body.from ?? "";
              const toPath = body.to ?? "";
              const { full: fromFull } = await resolveAssetPath(safeProject, fromPath);
              const { full: toFull } = await resolveAssetPath(safeProject, toPath);
              await movePath(fromFull, toFull);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/seed") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const fromProject = body.from ?? "sample-cafebrunch-menu";
              await seedAssets(safeProject, fromProject);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/save-project") {
              const body = await readJson(req);
              const slug = sanitizeSlug(body.slug ?? safeProject) || safeProject;
              if (readOnlyAssetProjects.has(slug)) {
                denyReadOnlyMutation();
                return;
              }
              const projectDir = path.resolve(root, slug);
              await fs.mkdir(projectDir, { recursive: true });
              const projectData = body.project ?? {};
              await fs.writeFile(
                path.join(projectDir, "menu.json"),
                JSON.stringify(projectData, null, 2)
              );
              const index = await readIndex();
              const cover = body.cover ?? projectData.backgrounds?.[0]?.src ?? "";
              const entry = {
                slug,
                name: body.name ?? projectData.meta?.name ?? slug,
                template: body.template ?? projectData.meta?.template ?? "",
                cover
              };
              const existingIndex = index.projects.findIndex((item) => item.slug === slug);
              if (existingIndex >= 0) {
                index.projects[existingIndex] = entry;
              } else {
                index.projects.push(entry);
              }
              await writeIndex(index);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/prepare-derived") {
              if (isReadOnlyProject) {
                denyReadOnlyMutation();
                return;
              }
              const body = await readJson(req);
              const projectData = body.project as MenuProject | undefined;
              if (!projectData || typeof projectData !== "object") {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Missing project payload" }));
                return;
              }
              const hasFfmpeg = await ensureFfmpegAvailable();
              if (!hasFfmpeg) {
                res.statusCode = 503;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error:
                      "ffmpeg is not available in this environment. Install ffmpeg to generate derived assets."
                  })
                );
                return;
              }
              const totalItems = (projectData.categories ?? []).reduce(
                (sum, category) => sum + (category.items?.length ?? 0),
                0
              );
              const startedAt = Date.now();
              console.info(
                `[prepare-derived] start project=${safeProject} backgrounds=${projectData.backgrounds?.length ?? 0} items=${totalItems}`
              );
              const prepared = await prepareProjectDerivedAssets(safeProject, projectData);
              console.info(
                `[prepare-derived] done project=${safeProject} elapsedMs=${Date.now() - startedAt}`
              );
              const projectDir = path.resolve(root, safeProject);
              await fs.mkdir(projectDir, { recursive: true });
              await fs.writeFile(path.join(projectDir, "menu.json"), JSON.stringify(prepared, null, 2));
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true, project: prepared }));
              return;
            }
            if (req.method === "POST" && pathname === "/rename-project") {
              const body = await readJson(req);
              const fromSlug = sanitizeSlug(body.from ?? "");
              const toSlug = sanitizeSlug(body.to ?? "");
              if (readOnlyAssetProjects.has(fromSlug) || readOnlyAssetProjects.has(toSlug)) {
                denyReadOnlyMutation();
                return;
              }
              if (!fromSlug || !toSlug || fromSlug === toSlug) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true }));
                return;
              }
              const fromDir = path.resolve(root, fromSlug);
              const toDir = path.resolve(root, toSlug);
              await movePath(fromDir, toDir);
              const index = await readIndex();
              const entry = index.projects.find((item) => item.slug === fromSlug);
              if (entry) {
                entry.slug = toSlug;
                if (typeof entry.cover === "string" && entry.cover.includes(`/projects/${fromSlug}/`)) {
                  entry.cover = entry.cover.replace(`/projects/${fromSlug}/`, `/projects/${toSlug}/`);
                }
              }
              await writeIndex(index);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            res.statusCode = 404;
            res.end("Not found");
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error?.message ?? "Server error" }));
          }
        });
      }
    }
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"]
  }
});
