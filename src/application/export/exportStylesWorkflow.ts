const EXPORT_SHARED_STYLE_START = "/* EXPORT_SHARED_STYLES_START */";
const EXPORT_SHARED_STYLE_END = "/* EXPORT_SHARED_STYLES_END */";

export const extractSharedExportStyles = (appCssRaw: string) => {
  const start = appCssRaw.indexOf(EXPORT_SHARED_STYLE_START);
  const end = appCssRaw.indexOf(EXPORT_SHARED_STYLE_END);
  if (start < 0 || end < 0 || end <= start) {
    console.warn("Shared export style markers are missing in src/app.css");
    return "";
  }
  return appCssRaw.slice(start + EXPORT_SHARED_STYLE_START.length, end).trim();
};

export const buildExportStyles = (appCssRaw: string) => `
* { box-sizing: border-box; }
html,
body,
#app {
  height: 100%;
}
html,
body {
  margin: 0;
  overflow: hidden;
}
body {
  background: #05060f;
  color: #e2e8f0;
}
#app {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
${extractSharedExportStyles(appCssRaw)}

.dish-modal {
  display: none;
}
.dish-modal.open {
  display: grid;
}
`;
