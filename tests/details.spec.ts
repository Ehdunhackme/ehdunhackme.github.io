import { test, expect } from "@playwright/test";

test("contact language controls stay in the header and persist", async ({
  page,
}) => {
  await page.goto("/contact/");
  const header = page.locator(".site-header");
  await header.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "联系", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "联系", exact: true }),
  ).toBeVisible();
  await header.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("project hover keeps one card selected and responsive images load", async ({
  page,
  isMobile,
}) => {
  await page.goto("/projects/");
  const first = page.locator("#platonic-representation");
  await first.scrollIntoViewIfNeeded();
  const image = first.locator(".paper-thumbnail img");
  await expect
    .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const source = await image.evaluate(
    (el) => (el as HTMLImageElement).currentSrc,
  );
  expect(new URL(source).pathname).toMatch(/^\/_next\/image\/?$/);
  expect(Number(new URL(source).searchParams.get("w"))).toBeLessThanOrEqual(
    640,
  );
  if (!isMobile) {
    for (const id of [
      "platonic-representation",
      "perturbation-robustness",
      "nonlinear-queries",
    ]) {
      await page.locator("#" + id).hover();
      await expect(page.locator("[data-focus-selected]")).toHaveCount(1);
      await expect(page.locator("[data-focus-selected]")).toHaveAttribute(
        "id",
        id,
      );
    }
  }
  await page.goto("/missing-page-check/");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
