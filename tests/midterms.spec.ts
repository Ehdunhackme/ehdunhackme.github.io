import { test, expect } from "@playwright/test";

const path = "/writings/2026-us-midterm-election-model/";

test("midterm article is searchable and has complete responsive figures", async ({
  page,
  request,
}) => {
  test.setTimeout(60000); // Includes decoding ten figures and opening the complete race tables in WebKit.
  const errors: string[] = [];
  await page.route("https://civicapi.org/api/v2/race/*", (route) => route.abort());
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("poll baseline blend");
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
  // A 200 response is not enough: every figure must decode after scrolling.
  for (const figure of await page.locator("article figure img").all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        figure.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBeTruthy();
    await figure.evaluate((img: HTMLImageElement) => img.decode());
  }
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
});
