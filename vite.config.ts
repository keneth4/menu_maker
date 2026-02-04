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
        const ensureProjectRoot = async (project: string) => {
          const base = path.resolve(root, project, "assets");
          await fs.mkdir(base, { recursive: true });
          return base;
        };
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

        server.middlewares.use("/api/assets", async (req, res) => {
          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const pathname = url.pathname.replace(/^\/api\/assets/, "");
            const project = url.searchParams.get("project") || "demo";
            if (req.method === "GET" && pathname === "/ping") {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "GET" && pathname === "/list") {
              const base = await ensureProjectRoot(project);
              const entries = await listEntries(base);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ entries }));
              return;
            }
            if (req.method === "GET" && pathname === "/file") {
              const assetPath = url.searchParams.get("path") || "";
              const { full } = await resolveAssetPath(project, assetPath);
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
              const { full } = await resolveAssetPath(project, path.join(targetPath, name));
              await fs.mkdir(path.dirname(full), { recursive: true });
              await fs.writeFile(full, buffer);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/delete") {
              const body = await readJson(req);
              const { full } = await resolveAssetPath(project, body.path ?? "");
              await fs.rm(full, { recursive: true, force: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/mkdir") {
              const body = await readJson(req);
              const { full } = await resolveAssetPath(project, body.path ?? "");
              await fs.mkdir(full, { recursive: true });
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.method === "POST" && pathname === "/move") {
              const body = await readJson(req);
              const fromPath = body.from ?? "";
              const toPath = body.to ?? "";
              const { full: fromFull } = await resolveAssetPath(project, fromPath);
              const { full: toFull } = await resolveAssetPath(project, toPath);
              await movePath(fromFull, toFull);
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
