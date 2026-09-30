// The only bridge between the site and the app. The site checks for `window.animehubDesktop` and uses it when present;
// in a normal browser it's undefined and nothing changes. main.js checks every message comes from the site.
const { contextBridge, ipcRenderer } = require("electron");

const version = (process.argv.find((a) => a.startsWith("--animehub-version=")) ?? "").split("=")[1] ?? "";

contextBridge.exposeInMainWorld("animehubDesktop", {
  version,
  platform: process.platform,
  // Referer the next anime stream needs (lib/stream-source.ts). Resolves true when applied.
  setStreamReferer: (referer) => ipcRenderer.invoke("stream-referer", String(referer ?? "")),
  // Native notification; clicking it opens `path` on the site.
  notify: (title, body, path) => ipcRenderer.send("notify", { title: String(title), body: String(body ?? ""), path: String(path ?? "") }),
  retry: () => ipcRenderer.send("retry"),
});
