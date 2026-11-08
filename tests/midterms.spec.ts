import { test, expect } from "@playwright/test";

const path = "/writings/2026-us-midterm-election-model/";

test("midterm article is searchable and has complete responsive figures", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("elastic net");
  await expect(page.locator(".writing-section-link:visible")).toHaveCount(1);
  await page
    .getByRole("link", { name: /2026 US Midterm Election Model/ })
    .click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "2026 US Midterm Election Model",
  );
  await expect(page.locator('.site-header [aria-current="page"]')).toHaveText(
    "Writings",
  );
  await expect(page.locator("article figure")).toHaveCount(11);
  const text = await page.locator("article").innerText();
  expect(text).toContain("Retrospective analysis");
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
  const mobile = (page.viewportSize()?.width || 1000) <= 640;
  expect(
    await first.evaluate((img: HTMLImageElement) => img.currentSrc),
  ).toContain(mobile ? "-mobile.svg" : "intervals.svg");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByText("House predictions (53 races)", { exact: true }).click();
  const houseTable = page.getByRole("region", {
    name: "House predictions (53 races)",
  });
  await expect(houseTable.locator("tbody tr")).toHaveCount(53);
  await expect(houseTable).toBeVisible();
  const assetPaths = await page
    .locator("article figure")
    .evaluateAll((figures) =>
      figures.flatMap((figure) => [
        figure.querySelector("img")!.getAttribute("src")!,
        figure.querySelector("source")!.getAttribute("srcset")!,
      ]),
    );
  for (const asset of assetPaths)
    expect((await request.get(asset)).status(), asset).toBe(200);
  const csv = await request.get(
    "/assets/writings/midterms-2026/2026-estimates.csv",
  );
  expect(csv.status()).toBe(200);
  expect((await csv.text()).trim().split("\n")).toHaveLength(69);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://dunlichan.com" + path,
  );
  expect(errors).toEqual([]);
});
