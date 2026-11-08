import { test, expect } from "@playwright/test";

test("every figure and equation renders even when the results feed fails", async ({
  page,
}, testInfo) => {
  const external = [];
  await page.route("https://civicapi.org/api/v2/race/*", (route) =>
    route.abort(),
  );
  page.on("request", (request) => {
    if (
      /^https?:/.test(request.url()) &&
      !request.url().startsWith("http://127.0.0.1:4173/") &&
      !request.url().startsWith("https://civicapi.org/api/v2/race/")
    )
      external.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("article h2").nth(0)).toHaveText(
    "Model prediction",
  );
  await expect(page.locator("article h2").nth(1)).toHaveText(
    "Model description",
  );
  await expect(page.locator("figure img")).toHaveCount(10);
  for (const figure of await page.locator("figure img").all()) {
    await figure.evaluate((image) => image.decode());
    expect(
      await figure.evaluate((image) => image.naturalWidth),
    ).toBeGreaterThan(0);
  }
  const narrow = page.viewportSize().width <= 640;
  const sources = await page
    .locator("figure img")
    .first()
    .evaluate((image) => ({
      current: image.currentSrc,
      desktop: image.getAttribute("src"),
      mobile: image.parentElement
        .querySelector("source")
        .getAttribute("srcset"),
    }));
  expect(sources.current).toBe(narrow ? sources.mobile : sources.desktop);
  await expect(page.locator("math")).toHaveCount(3);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await expect(
    page.getByText(/The benchmark covers 13 families and 47 settings/),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const [chamber, count] of [
    ["House", 435],
    ["Senate", 35],
  ]) {
    const label = `${chamber} predictions (${count} races)`;
    await page.getByText(label, { exact: true }).click();
    await expect(
      page.getByRole("region", { name: label }).locator("tbody tr"),
    ).toHaveCount(count);
    await page.getByText(label, { exact: true }).click();
  }
  await page
    .getByText("Senate predictions (35 races)", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("article-race-lists.png"),
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("article-top.png") });
  await page
    .getByRole("heading", { name: "Model description", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("article-model.png") });
  await page.locator('[id="05-benchmark-comparison"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("article-benchmark.png") });
  expect(external).toEqual([]);
});
