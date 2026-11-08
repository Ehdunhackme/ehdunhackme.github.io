// Generated article figures are embedded so a preview needs no image requests.
// Keep the original SVG files available for full-resolution downloads.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

async function main() {
  const root = path.resolve(__dirname, "..");
  const file = path.join(root, "src/content/midterms-2026.json");
  const article = JSON.parse(await fs.readFile(file, "utf8"));
  let bytes = 0;
  for (const block of article.blocks) {
    if (block.type !== "figure") continue;
    for (const mobile of [false, true]) {
      const name = `${block.slug}${mobile ? "-mobile" : ""}.svg`;
      const svg = await fs.readFile(
        path.join(root, "public/assets/writings/midterms-2026", name),
      );
      const { data: webp, info } = await sharp(svg, { density: 180 })
        .resize({ width: mobile ? 900 : 1800 })
        .webp({ quality: 94, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      bytes += webp.length;
      block[mobile ? "mobileSrc" : "src"] =
        `data:image/webp;base64,${webp.toString("base64")}`;
      block[mobile ? "mobileWidth" : "width"] = info.width;
      block[mobile ? "mobileHeight" : "height"] = info.height;
    }
  }
  await fs.writeFile(file, JSON.stringify(article, null, 2) + "\n");
  console.log(
    `Embedded all responsive figures: ${(bytes / 1024).toFixed(0)} KiB before base64 encoding`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
