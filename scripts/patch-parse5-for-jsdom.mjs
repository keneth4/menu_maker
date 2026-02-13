import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const patchJsdomWindow = async () => {
  const windowPath = path.resolve(
    process.cwd(),
    "node_modules",
    "jsdom",
    "lib",
    "jsdom",
    "browser",
    "Window.js"
  );
  let source;
  try {
    source = await fs.readFile(windowPath, "utf8");
  } catch {
    return;
  }

  const target = "window = vm.createContext(vm.constants.DONT_CONTEXTIFY);";
  if (!source.includes(target)) {
    return;
  }

  const replacement =
    "window = vm.createContext(vm.constants?.DONT_CONTEXTIFY ?? {});";
  await fs.writeFile(windowPath, source.replace(target, replacement));
  console.info("[patch-jsdom] Applied vm.constants.DONT_CONTEXTIFY fallback");
};

const parse5Root = path.resolve(process.cwd(), "node_modules", "parse5");
const pkgPath = path.join(parse5Root, "package.json");

const patchParse5 = async () => {
  let rawPackage;
  try {
    rawPackage = await fs.readFile(pkgPath, "utf8");
  } catch {
    return;
  }

  const pkg = JSON.parse(rawPackage);
  const version = String(pkg.version ?? "");
  if (!version.startsWith("8.")) {
    return;
  }

  const esmEntry = path.join(parse5Root, "dist", "index.js");
  const cjsEntry = path.join(parse5Root, "dist", "index.cjs");

  try {
    await build({
      entryPoints: [esmEntry],
      outfile: cjsEntry,
      bundle: true,
      platform: "node",
      format: "cjs",
      target: ["node20"],
      logLevel: "silent"
    });
  } catch (error) {
    console.warn("[patch-parse5] Unable to build CJS compatibility bundle", error);
    return;
  }

  const nextExports = {
    ".": {
      require: "./dist/index.cjs",
      default: "./dist/index.js"
    }
  };

  pkg.main = "dist/index.cjs";
  pkg.exports = nextExports;

  await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.info("[patch-parse5] Applied jsdom compatibility patch for parse5@8");
};

void (async () => {
  await patchParse5();
  await patchJsdomWindow();
})();
