# AnimeHub Desktop

The AnimeHub website in its own app, with extras a browser can't do:

- **No ads or pop-ups** from the video players (ad networks are blocked, and players can't open windows or redirect the app).
- **More anime episodes play in AnimeHub's own player** (resume, auto skip, Arabic subtitles), because the app can send the headers some video servers require.
- **Desktop notifications** when a new episode of a show on your list airs. Closing the window keeps AnimeHub in the tray so these keep coming; quit from the tray icon.
- **Always up to date**: the app shows the live site, so new features appear immediately. The app itself updates from this page's releases.

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

## Shortcuts

F5 reload · F11 full screen · Alt+← / Alt+→ back and forward. On watch pages: T theater · L focus mode · N next episode.

## Releasing an update (maintainer)

```sh
npm run release        # bumps the patch version, tags it, pushes; GitHub Actions builds Windows + Mac and publishes
```

Use `npm version minor` / `major` then `git push --follow-tags` for bigger versions. Test locally with `npm start`
(`ANIMEHUB_URL=http://localhost:3000 npm start` against a local site) and `npm run dist` for a local installer.
Website changes don't need an app release: they reach the app as soon as the site deploys.
