#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const projectsRoot = path.resolve(process.cwd(), "public", "projects");
const indexPath = path.resolve(projectsRoot, "index.json");
const generatedSlugPattern =
  /^ffmpeg-(?:probe(?:-save)?|export-\d+|save-\d+(?:-save)?)$/i;

const isGeneratedSlug = (value) => generatedSlugPattern.test(String(value || "").trim());

const extractSlugFromCover = (value) => {
  const raw = String(value || "");
  const match = raw.match(/\/projects\/([^/]+)\//i);
  return match?.[1] ?? "";
};

const removeGeneratedProjectDirectories = async () => {
  let entries = [];
  try {
    entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  const removed = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!isGeneratedSlug(entry.name)) continue;
    const fullPath = path.resolve(projectsRoot, entry.name);
    await fs.rm(fullPath, { recursive: true, force: true });
    removed.push(entry.name);
  }
  return removed;
};

const pruneGeneratedIndexEntries = async () => {
  let raw = "";
  try {
    raw = await fs.readFile(indexPath, "utf8");
  } catch {
    return 0;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 0;
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.projects)) {
    return 0;
  }

  const before = parsed.projects.length;
  parsed.projects = parsed.projects.filter((project) => {
    const slug = typeof project?.slug === "string" ? project.slug : "";
    const coverSlug = extractSlugFromCover(project?.cover);
    return !isGeneratedSlug(slug) && !isGeneratedSlug(coverSlug);
  });

  const removedCount = before - parsed.projects.length;
  if (removedCount > 0) {
    await fs.writeFile(indexPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  }
  return removedCount;
};

const main = async () => {
  const removedDirectories = await removeGeneratedProjectDirectories();
  const removedEntries = await pruneGeneratedIndexEntries();
  if (removedDirectories.length > 0 || removedEntries > 0) {
    const parts = [];
    if (removedDirectories.length > 0) {
      parts.push(`removed directories: ${removedDirectories.join(", ")}`);
    }
    if (removedEntries > 0) {
      parts.push(`removed index entries: ${removedEntries}`);
    }
    process.stdout.write(`[cleanup-test-generated-projects] ${parts.join(" | ")}\n`);
  }
};

await main();
