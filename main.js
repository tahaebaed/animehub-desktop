// AnimeHub desktop: the live site (so every Vercel deploy reaches the app instantly) in a window that adds what a
// browser can't: ad/pop-up blocking for third-party players, the Referer some anime streams need, desktop
// notifications, a tray icon, and self-updates from GitHub Releases.
const { app, BrowserWindow, Menu, Notification, Tray, dialog, ipcMain, nativeImage, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");
const { isAd } = require("./blocklist");

const SITE = process.env.ANIMEHUB_URL || "https://animehub-olive.vercel.app";
const SITE_ORIGIN = new URL(SITE).origin;
const RELEASES = "https://github.com/tahaebaed/animehub-desktop/releases/latest";
const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ""; } };
const matches = (host, list) => list.some((re) => re.test(host));
// Main-window navigations allowed besides the site: signing in goes through Supabase and Google.
const AUTH_HOSTS = [/\.supabase\.co$/, /^accounts\.google\.com$/, /^accounts\.youtube\.com$/, /^www\.google\.com$/];
// APIs the stream-header rewrite must never touch.
const FIRST_PARTY = [/\.supabase\.co$/, /(^|\.)anilist\.co$/, /(^|\.)themoviedb\.org$/, /(^|\.)tmdb\.org$/,
  /(^|\.)youtube(-nocookie)?\.com$/, /(^|\.)ytimg\.com$/, /(^|\.)googlevideo\.com$/, /(^|\.)vercel\.(app|com)$/, /(^|\.)github(usercontent)?\.com$/];

let win = null, tray = null, quitting = false;
// Referer for the anime stream being played, set by the site (lib/stream-source.ts `referer`). Only our page's own
// media requests to third-party hosts get it (plus a CORS allow for our origin), never iframes or APIs.
let stream = null; // { referer, origin }

if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => show());
app.setAppUserModelId("com.tahaebaed.animehub"); // Windows: notifications show the app's name and icon
// Google refuses sign-in from browsers that announce themselves as Electron.
app.userAgentFallback = app.userAgentFallback.replace(/ (Electron|AnimeHub)\/\S+/g, "");

// ---- Window state ----
const stateFile = () => path.join(app.getPath("userData"), "window.json");
const readState = () => { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return { width: 1400, height: 880 }; } };
const saveState = () => {
  if (!win || win.isMinimized()) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() })); } catch {}
};

function show(pathname) {
  if (!win) return createWindow(pathname);
  if (pathname) win.loadURL(SITE + pathname);
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
}

function createWindow(pathname = "/") {
  const s = readState();
  win = new BrowserWindow({
    ...s, minWidth: 900, minHeight: 600, show: false, backgroundColor: "#121212", autoHideMenuBar: true, title: "AnimeHub",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false,
      additionalArguments: [`--animehub-version=${app.getVersion()}`],
    },
  });
  if (s.maximized) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.on("resize", saveState); win.on("move", saveState);
  // Closing hides to the tray so new-episode notifications keep coming; Quit is in the tray menu.
  win.on("close", (e) => { if (!quitting) { e.preventDefault(); win.hide(); } });
  win.on("closed", () => { win = null; });

  const wc = win.webContents;
  // New windows: our own links open in the normal browser; anything a player tries to pop up is dropped.
  wc.setWindowOpenHandler(({ url, referrer }) => {
    if ((referrer?.url ?? "").startsWith(SITE_ORIGIN) && /^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  // The window never leaves the site (players redirecting the whole page to ads), except for sign-in.
  const guard = (e, url) => {
    const host = hostOf(url);
    if (url.startsWith(SITE_ORIGIN) || url.startsWith("file:") || matches(host, AUTH_HOSTS)) return;
    e.preventDefault();
  };
  wc.on("will-navigate", guard);
  wc.on("will-redirect", (e, url, _inPlace, isMainFrame) => { if (isMainFrame) guard(e, url); });
  wc.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && url.startsWith(SITE_ORIGIN)) win.loadFile(path.join(__dirname, "offline.html")); // -3: aborted, not a failure
  });
  wc.on("before-input-event", (_e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F5" || (input.control && input.key.toLowerCase() === "r")) wc.reload();
    else if (input.key === "F11") win.setFullScreen(!win.isFullScreen());
    else if (input.alt && input.key === "ArrowLeft" && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else if (input.alt && input.key === "ArrowRight" && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  });
  win.loadURL(SITE + pathname);
}

function setupSession() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    const ours = (details.requestingUrl ?? "").startsWith(SITE_ORIGIN);
    callback(ours && ["notifications", "fullscreen", "clipboard-sanitized-write"].includes(permission));
  });
  // Ads and pop-under networks, in every frame (this is what cleans up the embedded players).
  ses.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (d, cb) => cb({ cancel: isAd(hostOf(d.url)) }));

  const isStreamRequest = (d) => {
    if (!stream || (d.resourceType !== "xhr" && d.resourceType !== "media")) return false;
    if (!(d.referrer ?? "").startsWith(SITE_ORIGIN)) return false; // only our page's requests, not the players'
    const host = hostOf(d.url);
    return host && host !== hostOf(SITE) && !matches(host, FIRST_PARTY);
  };
  ses.webRequest.onBeforeSendHeaders({ urls: ["https://*/*"] }, (d, cb) => {
    if (!isStreamRequest(d)) return cb({ requestHeaders: d.requestHeaders });
    cb({ requestHeaders: { ...d.requestHeaders, Referer: stream.referer, Origin: stream.origin } });
  });
  ses.webRequest.onHeadersReceived({ urls: ["https://*/*"] }, (d, cb) => {
    if (!isStreamRequest(d)) return cb({ responseHeaders: d.responseHeaders });
    const headers = Object.fromEntries(Object.entries(d.responseHeaders ?? {}).filter(([k]) => !/^access-control-allow-(origin|credentials)$/i.test(k)));
    cb({ responseHeaders: { ...headers, "Access-Control-Allow-Origin": [SITE_ORIGIN] } });
  });
}

// ---- Messages from the site (preload.js) ----
const fromSite = (e) => e.senderFrame && e.senderFrame.url.startsWith(SITE_ORIGIN) && e.senderFrame === win?.webContents.mainFrame;
ipcMain.handle("stream-referer", (e, referer) => {
  if (!fromSite(e)) return false;
  try {
    const u = new URL(String(referer));
    stream = u.protocol === "https:" ? { referer: u.href, origin: u.origin } : null;
  } catch { stream = null; }
  return !!stream;
});
ipcMain.on("notify", (e, n) => {
  if (!fromSite(e) || !Notification.isSupported() || !n || typeof n.title !== "string") return;
  const note = new Notification({ title: n.title.slice(0, 120), body: String(n.body ?? "").slice(0, 300), icon: path.join(__dirname, "build", "icon.png") });
  const target = typeof n.path === "string" && n.path.startsWith("/") && !n.path.startsWith("//") ? n.path : undefined;
  note.on("click", () => show(target));
  note.show();
});
ipcMain.on("retry", (e) => { if (e.senderFrame?.url.startsWith("file:") || fromSite(e)) win?.loadURL(SITE); });

// ---- Updates ----
// Windows: download in the background, then offer a restart. macOS refuses to auto-install apps without a paid
// Apple signature, so the Mac build checks GitHub for a newer release and opens the download page instead.
const newer = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
let prompted = false;
async function checkForUpdates(manual = false) {
  if (!app.isPackaged) { if (manual) dialog.showMessageBox({ message: "Updates only run in the installed app." }); return; }
  if (process.platform === "darwin") {
    try {
      const r = await fetch("https://api.github.com/repos/tahaebaed/animehub-desktop/releases/latest", { headers: { Accept: "application/vnd.github+json" } });
      const latest = String((await r.json()).tag_name ?? "").replace(/^v/, "");
      if (latest && newer(latest, app.getVersion())) {
        if (prompted && !manual) return;
        prompted = true;
        const { response } = await dialog.showMessageBox({ type: "info", buttons: ["Download", "Later"], defaultId: 0, message: `AnimeHub ${latest} is available`, detail: `You have ${app.getVersion()}. Download it, then replace the app in Applications.` });
        if (response === 0) shell.openExternal(RELEASES);
      } else if (manual) dialog.showMessageBox({ message: "You're on the latest version." });
    } catch { if (manual) dialog.showMessageBox({ message: "Couldn't check for updates." }); }
    return;
  }
  if (manual) autoUpdater.once("update-not-available", () => dialog.showMessageBox({ message: "You're on the latest version." }));
  autoUpdater.checkForUpdates().catch(() => { if (manual) dialog.showMessageBox({ message: "Couldn't check for updates." }); });
}
autoUpdater.on("update-downloaded", async (info) => {
  const { response } = await dialog.showMessageBox({ type: "info", buttons: ["Restart now", "Later"], defaultId: 0, message: `AnimeHub ${info.version} is ready`, detail: "Restart the app to finish updating." });
  if (response === 0) { quitting = true; autoUpdater.quitAndInstall(); }
});

function setupTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "build", "icon.png")).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip("AnimeHub");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open AnimeHub", click: () => show() },
    { label: "Movies & Series", click: () => show("/movies") },
    { type: "separator" },
    { label: "Check for updates", click: () => checkForUpdates(true) },
    { label: `Version ${app.getVersion()}`, enabled: false },
    { type: "separator" },
    { label: "Quit", click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on("click", () => show());
}

app.whenReady().then(() => {
  setupSession();
  createWindow();
  setupTray();
  checkForUpdates();
  setInterval(() => checkForUpdates(), 4 * 3600_000);
});
app.on("activate", () => show()); // macOS dock click
app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => {}); // stay in the tray
