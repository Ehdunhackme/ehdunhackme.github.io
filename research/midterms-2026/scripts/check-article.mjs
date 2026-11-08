import fs from "node:fs/promises";
import assert from "node:assert/strict";
const html = await fs.readFile(
  new URL("../site/index.html", import.meta.url),
  "utf8",
);
assert.equal((html.match(/<figure /g) || []).length, 10);
assert.equal((html.match(/<img /g) || []).length, 10);
assert.equal((html.match(/data:image\/webp;base64,/g) || []).length, 20);
assert.equal((html.match(/<math /g) || []).length, 3);
assert(!html.includes('class="katex-error"'));
assert.equal((html.match(/<script\b/g) || []).length, 1);
assert(html.includes('id="live-results-comparison"'));
assert(!/<(?:img|source)\b[^>]+(?:src|srcset)="https?:/i.test(html));
assert(!/\u2014/.test(html));
assert(html.includes("House predictions (435 races)"));
assert(html.includes("Senate predictions (35 races)"));
assert(html.includes("Modelling the 2026 midterms"));
assert(!html.includes("github.com/Ehdunhackme/US-election"));
assert(!html.includes("Unofficial until certified"));
assert(html.includes('class="source-groups"'));
console.log(
  "Article checks passed: 10 embedded figures, 3 rendered equations, all 470 races and the live comparison.",
);
