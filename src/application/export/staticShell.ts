import type { ZipBinaryEntry } from "./projectZip";

export const buildExportHtml = (version: string) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>Menu Export</title>
    <link rel="icon" href="favicon.ico" />
    <link rel="stylesheet" href="styles.css?v=${version}" />
  </head>
  <body>
    <div id="app"></div>
    <div id="dish-modal" class="dish-modal">
      <div id="dish-modal-content" class="dish-modal__card"></div>
    </div>
    <script src="app.js?v=${version}"></scr${"ipt"}>
  </body>
</html>
`;

const serveCommand = `#!/bin/bash
set -e
cd "$(dirname "$0")"
python3 -m http.server 4173 --bind 127.0.0.1
`;

const serveBat = `@echo off
cd /d %~dp0
python -m http.server 4173 --bind 127.0.0.1
`;

const readme = `Open this exported site with a local server (recommended).

macOS / Linux:
1. Run chmod +x serve.command
2. Run ./serve.command
3. Open http://127.0.0.1:4173

Windows:
1. Run serve.bat
2. Open http://127.0.0.1:4173
`;

export const buildStaticShellEntries = (options: {
  menuJson: string;
  stylesCss: string;
  appJs: string;
  exportVersion: string;
  faviconIco: Uint8Array;
}) => {
  const { menuJson, stylesCss, appJs, exportVersion, faviconIco } = options;
  const encoder = new TextEncoder();
  const entries: ZipBinaryEntry[] = [
    { name: "menu.json", data: encoder.encode(menuJson) },
    { name: "styles.css", data: encoder.encode(stylesCss) },
    { name: "app.js", data: encoder.encode(appJs) },
    { name: "index.html", data: encoder.encode(buildExportHtml(exportVersion)) },
    { name: "favicon.ico", data: faviconIco },
    { name: "serve.command", data: encoder.encode(serveCommand) },
    { name: "serve.bat", data: encoder.encode(serveBat) },
    { name: "README.txt", data: encoder.encode(readme) }
  ];
  return entries;
};
