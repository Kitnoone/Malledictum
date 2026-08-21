import { cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptsDirectory, "..");
const buildDirectory = join(projectRoot, "dist");
const publishedEntries = [
  "index.html",
  "assets",
  "weapon-icons",
  "rule-pages",
  "favicon.svg",
  "og.png",
  "ornate-rail.png",
  ".nojekyll",
];

cpSync(join(buildDirectory, "index.source.html"), join(buildDirectory, "index.html"), { force: true });

for (const entry of publishedEntries) {
  const source = join(buildDirectory, entry);
  const destination = join(projectRoot, entry);

  if (!existsSync(source)) continue;
  cpSync(source, destination, { force: true, recursive: true });
}
