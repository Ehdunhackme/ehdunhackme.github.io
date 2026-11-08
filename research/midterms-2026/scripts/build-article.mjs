import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = path.join(root, "reports");
const article = JSON.parse(
  await fs.readFile(path.join(report, "article.json"), "utf8"),
);
const liveConfig = {
  predictions: JSON.parse(
    await fs.readFile(path.join(root, "website/live/predictions.json"), "utf8"),
  ),
  snapshot: JSON.parse(
    await fs.readFile(
      path.join(root, "data/results/live-snapshot.json"),
      "utf8",
    ),
  ),
};
const liveCore = await fs.readFile(
  path.join(root, "website/live/core.mjs"),
  "utf8",
);
const liveWidget = (
  await fs.readFile(path.join(root, "website/live/widget.mjs"), "utf8")
).replace(/^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/core\.mjs["'];?\s*/, "");
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const dataURL = (mime, bytes) =>
  `data:${mime};base64,${bytes.toString("base64")}`;
let mathCSS = await fs.readFile(
  path.join(root, "node_modules/katex/dist/katex.min.css"),
  "utf8",
);
for (const match of [...mathCSS.matchAll(/url\(([^)]+)\)/g)]) {
  const relative = match[1].replace(/["']/g, "");
  const bytes = await fs.readFile(
    path.join(root, "node_modules/katex/dist", relative),
  );
  mathCSS = mathCSS.replace(
    match[0],
    `url("${dataURL(relative.endsWith("woff2") ? "font/woff2" : relative.endsWith("woff") ? "font/woff" : "font/ttf", bytes)}")`,
  );
}
const bodyFont = dataURL(
  "font/ttf",
  await fs.readFile(path.join(root, "assets/fonts/Geist-Regular.ttf")),
);
const css = `
@font-face{font-family:Geist;src:url("${bodyFont}")}*{box-sizing:border-box}
html{color-scheme:dark}body{margin:0;background:#1a1a1a;color:#c2c2c2;font:16px/1.75 Geist,system-ui,sans-serif}
nav{max-width:780px;margin:auto;padding:28px 22px;display:flex;gap:26px;font-size:14px}
nav a{color:#a7a7a7;text-decoration:none}nav a:last-child{color:#f5f5f5}
main{max-width:calc(70ch + 44px);margin:auto;padding:44px 22px 96px}h1{font-size:32px;line-height:1.2;letter-spacing:-.025em;color:#f5f5f5;margin:0 0 16px}
header{margin-bottom:36px}.date,.note{color:#969696;font-size:13px;margin:6px 0}
h2{font-size:20px;line-height:1.4;color:#f5f5f5;margin:48px 0 16px}header+h2{margin-top:0}
p{margin:0 0 20px}a{color:inherit;text-underline-offset:3px}figure{width:100%;margin:28px 0 40px}
figure picture,figure img{display:block;width:100%;height:auto}figcaption{font-size:13px;line-height:1.6;color:#969696;margin:14px 0 0;max-width:74ch}
.equation{overflow-x:auto;padding:24px 8px;margin:24px 0 32px;color:#e6e6e6;font-size:17px}.katex-display{margin:0;width:max-content;min-width:100%}
.table{overflow:auto;margin:24px 0}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.55}th,td{padding:12px 14px;text-align:left;min-width:90px;vertical-align:top}thead th{border-bottom:1px solid #383838}th{color:#eee;font-weight:500}th:first-child,td:first-child{padding-left:0}
details{border:0;margin:8px 0}summary{cursor:pointer;padding:10px 0;min-height:44px;color:#eee;font-weight:500}summary::marker{color:#969696;font-size:.75em}summary:hover{text-decoration:underline;text-underline-offset:4px}
footer{margin-top:48px}.downloads{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0 0 28px;font-size:14px}.source-groups{font-size:13px;line-height:1.7;margin:0}.source-groups>div{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;margin-bottom:16px}.source-groups dt{font-weight:500;color:#aaa9a6}.source-groups dd{display:flex;flex-wrap:wrap;gap:4px 16px;margin:0}
:focus-visible{outline:2px solid #8ab4ff;outline-offset:4px}
@media(max-width:900px){figure{width:100%;margin-left:0;margin-right:0}}
@media(max-width:640px){main{padding-top:24px}nav{gap:20px;font-size:12px}h1{font-size:28px}h2{font-size:20px;margin-top:40px}figure{margin-block:24px 32px}.equation{font-size:13px;padding:16px 0}p{margin-bottom:20px}.source-groups>div{grid-template-columns:1fr;gap:4px;margin-bottom:20px}}
`;
let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(article.title)}</title><style>${mathCSS}\n${css}</style></head><body><nav aria-label="Main navigation"><a href="https://dunlichan.com/">Home</a><a href="https://dunlichan.com/about/">More about me</a><a href="https://dunlichan.com/projects/">Projects</a><a href="https://dunlichan.com/writings/">Writings</a></nav><main><article><header><h1>${escape(article.title)}</h1><p class="date">${escape(article.dateLabel)}</p><p class="note">${escape(article.note)}</p></header>`;
let figures = 0;
for (const block of article.blocks) {
  if (block.type === "live")
    html +=
      '<div id="live-results-comparison"><noscript>Enable JavaScript to compare the fixed model with live results.</noscript></div>';
  if (block.type === "heading")
    html += `<h2 id="${escape(block.id)}">${escape(block.text)}</h2>`;
  if (block.type === "paragraph") html += `<p>${escape(block.text)}</p>`;
  if (block.type === "equation")
    html += `<div class="equation" role="region" tabindex="0" aria-label="${escape(block.text)}">${katex.renderToString(block.latex, { displayMode: true, throwOnError: true, trust: false })}</div>`;
  if (block.type === "figure") {
    const images = [];
    for (const mobile of [false, true]) {
      const bytes = await fs.readFile(
        path.join(report, "web", `${block.slug}${mobile ? "-mobile" : ""}.svg`),
      );
      const webp = await sharp(bytes, { density: 180 })
        .resize({ width: mobile ? 900 : 1800 })
        .webp({ quality: 94, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      images.push({
        src: dataURL("image/webp", webp.data),
        width: webp.info.width,
        height: webp.info.height,
      });
    }
    html += `<figure id="${escape(block.slug)}"><picture><source media="(max-width:640px)" srcset="${images[1].src}" width="${images[1].width}" height="${images[1].height}"><img src="${images[0].src}" width="${images[0].width}" height="${images[0].height}" alt="${escape(block.alt)}" loading="eager"></picture><figcaption>${escape(block.caption)}</figcaption></figure>`;
    figures++;
  }
  if (block.type === "table") {
    if (block.summary)
      html += `<details><summary>${escape(block.summary)}</summary>`;
    html += `<div class="table" role="region" tabindex="0" aria-label="${escape(block.summary || block.columns[0] + " table")}"><table><thead><tr>${block.columns.map((c) => `<th scope="col">${escape(c)}</th>`).join("")}</tr></thead><tbody>`;
    for (const row of block.rows)
      html += `<tr>${row.map((v, i) => `<${i === 0 ? 'th scope="row"' : "td"}>${escape(typeof v === "number" && !Number.isInteger(v) ? v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : v)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`;
    html += `</tbody></table></div>`;
    if (block.summary) html += `</details>`;
  }
}
const groups = [...new Set(article.sources.map((source) => source.group))];
const downloadRoot = "https://dunlichan.com/assets/writings/midterms-2026";
html += `<footer><h2>Sources and code</h2><div class="downloads"><a href="https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/research/midterms-2026">Model code and data</a><a href="${downloadRoot}/2026-estimates.csv">Estimates CSV</a><a href="${downloadRoot}/benchmark-leaderboard.csv">Benchmark CSV</a></div><dl class="source-groups">${groups
  .map(
    (group) =>
      `<div><dt>${escape(group)}</dt><dd>${article.sources
        .filter((source) => source.group === group)
        .map(
          (source) =>
            `<a href="${escape(source.url)}">${escape(source.label)}</a>`,
        )
        .join("")}</dd></div>`,
  )
  .join("")}</dl></footer></article></main></body></html>`;
await fs.mkdir(path.join(root, "site"), { recursive: true });
html = html.replace(
  "</body>",
  `<script type="module">${liveCore}\n${liveWidget}\nmountComparison(document.getElementById("live-results-comparison"), ${JSON.stringify(liveConfig).replaceAll("<", "\\u003c")});</script></body>`,
);
await fs.writeFile(path.join(root, "site/index.html"), html);
console.log(
  `Built site/index.html with ${figures} embedded responsive figures and server-rendered LaTeX.`,
);
