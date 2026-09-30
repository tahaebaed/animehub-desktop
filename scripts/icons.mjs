// Renders build/icon.png (1024 px) from the site's icon (../app/icon.svg) for the installers, window and tray.
// Run from desktop/ inside the AnimeHub project: npm run icons (uses the site's copy of sharp).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const sharp = createRequire(new URL("../../package.json", import.meta.url))("sharp");
const svg = readFileSync(new URL("../../app/icon.svg", import.meta.url));
await sharp(svg, { density: 1200 }).resize(1024, 1024).png().toFile(new URL("../build/icon.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
console.log("build/icon.png written");
