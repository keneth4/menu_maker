import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import fs from "node:fs/promises";
import path from "node:path";

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: "asset-bridge",
      configureServer(server) {
        const root = path.resolve(process.cwd(), "public", "projects");
        const indexPath = path.resolve(root, "index.json");
        const ensureProjectRoot = async (project: string) => {
          const base = path.resolve(root, project, "assets");
          await fs.mkdir(base, { recursive: true });
          return base;
        };
        const sanitizeSlug = (value: string) =>
          value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
        const resolveAssetPath = async (project: string, targetPath: string) => {
          const base = await ensureProjectRoot(project);
          const safePath = targetPath.replace(/^\/+/, "");
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
        const seedAssets = async (project: string, fromProject = "demo") => {
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

        server.middlewares.use("/api/assets", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const pathname = url.pathname.replace(/^\/api\/assets/, "");
            const project = url.searchParams.get("project") || "demo";
            const safeProject = sanitizeSlug(project || "demo") || "demo";
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
              const body = await readJson(req);
              const { full } = await resolveAssetPath(safeProject, body.path ?? "");
              await fs.rm(full, { recursive: true, force: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/mkdir") {
              const body = await readJson(req);
              const { full } = await resolveAssetPath(safeProject, body.path ?? "");
              await fs.mkdir(full, { recursive: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/move") {
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
              const body = await readJson(req);
              const fromProject = body.from ?? "demo";
              await seedAssets(safeProject, fromProject);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/save-project") {
              const body = await readJson(req);
              const slug = sanitizeSlug(body.slug ?? safeProject) || safeProject;
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
            if (req.method === "POST" && pathname === "/rename-project") {
              const body = await readJson(req);
              const fromSlug = sanitizeSlug(body.from ?? "");
              const toSlug = sanitizeSlug(body.to ?? "");
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
    setupFiles: ["./vitest.setup.ts"]
  }
});
