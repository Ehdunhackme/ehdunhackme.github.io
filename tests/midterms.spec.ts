import { test, expect } from "@playwright/test";

const path = "/writings/2026-us-midterm-election-model/";

test("midterm article is searchable and has complete responsive figures", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(60000); // Includes decoding ten figures and opening the complete race tables in WebKit.
  const errors: string[] = [];
  await page.route("https://civicapi.org/api/v2/race/*", (route) =>
    route.abort(),
  );
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("poll baseline blend");
  await expect(page.locator(".writing-section-link:visible")).toHaveCount(1);
  await page.getByRole("link", { name: /Modelling the 2026 midterms/ }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Modelling the 2026 midterms",
  );
  await expect(page.locator('.site-header [aria-current="page"]')).toHaveText(
    "Writings",
  );
  await expect(page.locator("article figure")).toHaveCount(10);
  await expect(page.locator("article h2").nth(0)).toHaveText(
    "Model prediction",
  );
  await expect(page.locator("article h2").nth(1)).toHaveText(
    "Model description",
  );
  const text = await page.locator("article").innerText();
  expect(text).toContain("Written after Election Day");
  expect(text).not.toMatch(/\u2014|inspired by|chooi|chojeq|jeqin/i);
  const first = page.locator("article figure img").first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toBeVisible();
  await expect
    .poll(() =>
      first.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBeTruthy();
  // Check every lazy figure in one browser call. Repeated trace snapshots of
  // this illustrated article make individual WebKit protocol calls expensive.
  const decoded = await page
    .locator("article figure img")
    .evaluateAll(async (images) => {
      const results = [];
      for (const element of images) {
        const img = element as HTMLImageElement;
        img.scrollIntoView();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        await img.decode();
        results.push({ complete: img.complete, width: img.naturalWidth });
      }
      return results;
    });
  expect(decoded).toHaveLength(10);
  expect(decoded.every((img) => img.complete && img.width > 0)).toBe(true);
  const alignment = await page.locator("article").evaluate((article) => {
    const text = article.querySelector(":scope > p")!.getBoundingClientRect();
    const blocks = [
      ...article.querySelectorAll(
        ":scope > figure, :scope > [role=region], :scope > #live-results-comparison, :scope > section",
      ),
    ];
    return blocks.every((block) => {
      const bounds = block.getBoundingClientRect();
      return (
        Math.abs(bounds.left - text.left) < 1 &&
        Math.abs(bounds.width - text.width) < 1
      );
    });
  });
  expect(alignment).toBe(true);
  await expect(page.locator("article dl").last().locator("dt")).toHaveText([
    "Results",
    "Election data",
    "Context",
    "Polling",
  ]);
  await expect(
    page.getByRole("link", { name: "Model code and data", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/Ehdunhackme/ehdunhackme.github.io/tree/main/research/midterms-2026",
  );
  expect(
    await page.locator("article a[href*='Ehdunhackme/US-election']").count(),
  ).toBe(0);
  expect(
    await page.locator("article > p, article figcaption").allTextContents(),
  ).not.toEqual(expect.arrayContaining([expect.stringContaining("Ohio")]));
  const mobile = (page.viewportSize()?.width || 1000) <= 640;
  const selectedSource = await first.evaluate((img: HTMLImageElement) => ({
    current: img.currentSrc,
    desktop: img.getAttribute("src"),
    mobile: img.parentElement?.querySelector("source")?.getAttribute("srcset"),
  }));
  expect(selectedSource.current).toMatch(/^data:image\/webp;base64,/);
  expect(selectedSource.current).toBe(
    mobile ? selectedSource.mobile : selectedSource.desktop,
  );
  await expect(page.locator("article .katex")).toHaveCount(3);
  await expect(page.locator("article math")).toHaveCount(3);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByText("House predictions (435 races)", { exact: true })
    .click();
  const houseTable = page.getByRole("region", {
    name: "House predictions (435 races)",
  });
  await expect(houseTable.locator("tbody tr")).toHaveCount(435);
  await page
    .getByText("Senate predictions (35 races)", { exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Senate predictions (35 races)" })
      .locator("tbody tr"),
  ).toHaveCount(35);
  await expect(houseTable).toBeVisible();
  const assetPaths = await page
    .locator("article figure")
    .evaluateAll((figures) =>
      figures.map((figure) => figure.querySelector("a")!.getAttribute("href")!),
    );
  for (const asset of assetPaths)
    expect((await request.get(asset)).status(), asset).toBe(200);
  const csv = await request.get(
    "/assets/writings/midterms-2026/2026-estimates.csv",
  );
  expect(csv.status()).toBe(200);
  expect((await csv.text()).trim().split("\n")).toHaveLength(471);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://dunlichan.com" + path,
  );
  expect(errors).toEqual([]);
  await page
    .getByRole("heading", { name: "Sources and code", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("article-sources.png") });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("article-top.png") });
});
