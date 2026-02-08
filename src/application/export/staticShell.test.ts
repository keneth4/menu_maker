import { buildExportHtml, buildStaticShellEntries } from "./staticShell";

describe("static export shell helpers", () => {
  it("builds cache-busted export html", () => {
    const html = buildExportHtml("12345");
    expect(html).toContain('href="styles.css?v=12345"');
    expect(html).toContain('src="app.js?v=12345"');
    expect(html).toContain('id="dish-modal"');
  });

  it("builds expected shell archive entries", () => {
    const favicon = new Uint8Array([1, 2, 3]);
    const entries = buildStaticShellEntries({
      menuJson: '{"meta":{"slug":"demo"}}',
      stylesCss: "body { background: black; }",
      appJs: "console.log('ok');",
      exportVersion: "7",
      faviconIco: favicon
    });

    expect(entries.map((entry) => entry.name)).toEqual([
      "menu.json",
      "styles.css",
      "app.js",
      "index.html",
      "favicon.ico",
      "serve.command",
      "serve.bat",
      "README.txt"
    ]);
    const htmlEntry = entries.find((entry) => entry.name === "index.html");
    expect(new TextDecoder().decode(htmlEntry!.data)).toContain("styles.css?v=7");
    const iconEntry = entries.find((entry) => entry.name === "favicon.ico");
    expect(iconEntry?.data).toBe(favicon);
  });
});
