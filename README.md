# AnimeHub apps

AnimeHub for Windows, Mac and Android, with extras a browser can't do:

- **No ads or pop-ups** from the video players (ad networks are blocked, and players can't open windows or redirect the app).
- **More anime episodes play in AnimeHub's own player** (resume, auto skip, Arabic subtitles), because the app can send the headers some video servers require.
- **Desktop notifications** when a new episode of a show on your list airs. Closing the window keeps AnimeHub in the tray so these keep coming; quit from the tray icon.
- **Always up to date**: new versions install from this page's releases (automatically on Windows).

## Install

Download from **[Releases → latest](https://github.com/tahaebaed/animehub-desktop/releases/latest)**.

**Windows:** run `AnimeHub-Setup-x.y.z.exe`. The app isn't signed with a paid certificate, so Windows shows
"Windows protected your PC" the first time: click **More info → Run anyway**. Updates then install automatically
(you'll be asked to restart).

**Mac:** open `AnimeHub-x.y.z-mac.dmg` and drag AnimeHub to Applications. The first time, macOS blocks apps from
unidentified developers: **right-click AnimeHub → Open → Open**. If it says the app "is damaged", run this once in
Terminal, then open it again:

```sh
xattr -cr /Applications/AnimeHub.app
```

Macs don't install updates by themselves for unsigned apps: when a new version is out, AnimeHub asks and opens this
page. Download the new `.dmg` and replace the app.

**Android:** download `AnimeHub-x.y.z.apk` on your phone and open it. Android asks to allow installing apps from
your browser the first time: tap **Settings → Allow from this source**, go back, then **Install**. If Play Protect warns
about an unknown app, tap **More details → Install anyway** (it only means the app isn't from the Play Store).
When a new version is out, AnimeHub offers to download it: open the downloaded file and tap **Update**.
The Android app shows the live AnimeHub site with the same ad blocking, plus full-screen landscape video and
new-episode notifications (allow notifications when asked).

## Shortcuts

F5 reload · F11 full screen · Alt+← / Alt+→ back and forward. On watch pages: T theater · L focus mode · N next episode.

