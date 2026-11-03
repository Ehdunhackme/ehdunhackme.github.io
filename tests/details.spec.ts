import { test, expect } from "@playwright/test";

test("every explanation has readable headings, section spacing and unclipped content", async ({
  page,
}) => {
  await page.goto("/projects/");
  await page.evaluate(() => document.fonts.ready);
  const explanations = page.locator(".paper-explanation");
  await expect(explanations).toHaveCount(14);

  for (const explanation of await explanations.all()) {
    await explanation.locator("summary").click();
    await expect(explanation).toHaveAttribute("open", "");
    await expect(explanation).not.toHaveClass(/is-animating/);
    const layout = await explanation.evaluate((el) => {
      const summary = el.querySelector("summary")!.getBoundingClientRect();
      const body = el.querySelector(".paper-explanation-body")!;
      const sections = [...body.querySelectorAll(".explanation-section")];
      const bounds = body.getBoundingClientRect();
      return {
        firstHeadingGap:
          sections[0].querySelector("dt")!.getBoundingClientRect().top -
          summary.bottom,
        fontSize: parseFloat(getComputedStyle(body).fontSize),
        weights: sections.map((section) =>
          parseInt(getComputedStyle(section.querySelector("dt")!).fontWeight),
        ),
        sectionGaps: sections
          .slice(1)
          .map(
            (section, index) =>
              section.getBoundingClientRect().top -
              sections[index].getBoundingClientRect().bottom,
          ),
        contentFits:
          body.scrollWidth <= body.clientWidth + 1 &&
          bounds.bottom <= el.getBoundingClientRect().bottom + 1,
      };
    });
    expect(layout.firstHeadingGap).toBeGreaterThan(20);
    expect(layout.fontSize).toBeLessThan(16);
    expect(layout.weights).toEqual([600, 600, 600]);
    expect(layout.sectionGaps.every((gap) => gap >= 12)).toBe(true);
    expect(layout.contentFits).toBe(true);
    await explanation.locator("summary").click();
    await expect(explanation).not.toHaveAttribute("open", "");
  }
});

test("contact language controls stay in the header and persist", async ({
  page,
}) => {
  await page.goto("/contact/");
  await page.waitForLoadState("networkidle");
  const header = page.locator(".site-header");
  await header.getByRole("button", { name: "中文", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "联系", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await page.reload();
  await page.waitForLoadState("networkidle");
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
