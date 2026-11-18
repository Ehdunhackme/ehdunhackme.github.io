import { readFile, mkdir, cp, copyFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!process.argv[2])
  throw new Error("Usage: npm run sync:smollertts -- /path/to/SmollerTTS");
const source = path.resolve(process.argv[2]);
const built = path.join(source, "dist/projects/smollertts");
const manifest = JSON.parse(
  await readFile(path.join(built, "assets.json"), "utf8"),
);
if (manifest.name !== "SmollerTTS" || !manifest.files["index.html"])
  throw new Error("Not a SmollerTTS build");
for (const [name, expected] of Object.entries(manifest.files)) {
  const filename = path.resolve(built, name);
  if (!filename.startsWith(built + path.sep))
    throw new Error(`Invalid manifest path: ${name}`);
  const bytes = await readFile(filename);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== expected.bytes || sha256 !== expected.sha256)
    throw new Error(`Unverified asset: ${name}`);
}
const figure = path.join(source, "docs/assets/architecture.png");
await readFile(figure);
const destination = path.resolve(root, "public/projects/smollertts");
const allowed = path.resolve(root, "public/projects") + path.sep;
if (
  !destination.startsWith(allowed) ||
  path.basename(destination) !== "smollertts"
)
  throw new Error("Invalid destination");
try {
  const existing = JSON.parse(
    await readFile(path.join(destination, "assets.json"), "utf8"),
  );
  if (existing.name !== "SmollerTTS")
    throw new Error("Destination belongs to another project");
  await rm(destination, { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await cp(built, destination, { recursive: true });
await mkdir(path.join(root, "public/assets/project-previews"), {
  recursive: true,
});
await copyFile(
  figure,
  path.join(root, "public/assets/project-previews/smollertts-architecture.png"),
);
console.log(
  `Imported verified SmollerTTS build ${manifest.build} (${Object.keys(manifest.files).length} assets)`,
);
