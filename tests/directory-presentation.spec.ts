import { test, expect } from "@playwright/test";

test("directory metadata and separators stay consistent", async ({ page }) => {
  await page.goto("/projects/");
  await page.waitForLoadState("networkidle");
  const style = (el: Element) => {
    const css = getComputedStyle(el);
    return [css.fontSize, css.lineHeight, css.color, css.fontFamily];
  };
  const dateStyle = await page.locator(".paper-date").first().evaluate(style);
  const descriptionStyle = await page
    .locator(".project-description")
    .first()
    .evaluate(style);
  for (const id of ["magnetic-ring", "double-pendulum", "epecscan"]) {
    const entry = page.locator(`#${id}`);
    await expect(entry.locator(".paper-meta")).toHaveText("2024");
    const meta = await entry.locator(".paper-meta").boundingBox();
    const description = await entry
      .locator(".project-description")
      .boundingBox();
    expect(description!.y).toBeGreaterThanOrEqual(meta!.y + meta!.height);
  }
  const entry = page.locator("#platonic-representation");
  await entry.getByRole("button", { name: "AI summary" }).click();
  await expect(entry.locator(".paper-explanation-body")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  for (const metadata of await page
    .locator(".paper-meta, .project-affiliation, .coauthors")
    .all()) {
    await expect(metadata).not.toContainText("·");
  }
  for (const heading of await page.locator(".directory-group h2").all()) {
    const title = await heading.locator(".directory-group-title").boundingBox();
    const count = await heading.locator(".directory-group-count").boundingBox();
    expect(count!.x).toBeGreaterThan(title!.x + title!.width);
    expect(
      await heading.evaluate((el) => getComputedStyle(el, "::after").height),
    ).toBe("1px");
  }
  for (const section of await page.locator(".directory-group").all()) {
    await expect(section).toHaveCSS("border-top-width", "0px");
  }

  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
  const entries = page.locator(".writing-card-list > li");
  await expect(entries.first()).toHaveCSS("border-top-width", "0px");
  await expect(entries.nth(1)).toHaveCSS("border-top-width", "1px");
  expect(await page.locator(".writing-date").first().evaluate(style)).toEqual(
    dateStyle,
  );
  expect(
    await page.locator(".writing-section-description").first().evaluate(style),
  ).toEqual(descriptionStyle);
  await page.getByRole("searchbox").fill("opinionated");
  await expect(entries.nth(1)).toHaveCSS("border-top-width", "0px");
});

test("AI summary actions stay anchored through opening and closing", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/projects/");
  await page.waitForLoadState("networkidle");
  for (const view of ["Detailed view", "Compact view"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await expect(page.locator(".directory-page")).toHaveAttribute(
      "data-view",
      view === "Detailed view" ? "detailed" : "compact",
    );
    await page.waitForTimeout(250);
    for (const id of [
      "nonlinear-queries",
      "perturbation-robustness",
      "latent-safety-probes",
      "anthropogenic-vlm",
      "chert",
    ]) {
      const button = page.locator(`#${id} .paper-summary-toggle`);
      await button.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const position = () =>
        button.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y + scrollY, width: rect.width };
        });
      const before = await position();
      for (const expanded of ["true", "false"]) {
        await button.click();
        await expect(button).toHaveAttribute("aria-expanded", expanded);
        // Sample during the transition as well as after it settles.
        for (const delay of [60, 250]) {
          await page.waitForTimeout(delay);
          const after = await position();
          expect(
            Math.abs(after.x - before.x),
            `${id} horizontal shift`,
          ).toBeLessThan(1);
          expect(
            Math.abs(after.y - before.y),
            `${id} vertical shift`,
          ).toBeLessThan(1);
          expect(
            Math.abs(after.width - before.width),
            `${id} width shift`,
          ).toBeLessThan(1);
        }
      }
    }
  }
});

test("writing uses the original page entrance and leaves the header still", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const header = page.locator(".site-header");
  await header.getByRole("link", { name: "Writings", exact: true }).click();
  await expect(page).toHaveURL(/\/writings\/$/);
  await expect(page.locator("main")).toHaveCSS(
    "animation-name",
    "site-entry-reveal",
  );
  for (const name of [/Modelling the 2026/, /My opinionated guide/]) {
    await page.getByRole("link", { name }).click();
    await expect(page.locator(".writing-content h1")).toHaveText(name);
    await expect(page.locator("main")).toHaveCSS(
      "animation-name",
      "site-entry-reveal",
    );
    await expect(page.locator("main")).toHaveCSS("opacity", "1");
    await expect(header).toHaveCSS("animation-name", "none");
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-writing-transition",
    );
    await page.goBack();
    await expect(page.locator(".writing-section-link")).toHaveCount(2);
  }
  expect(errors).toEqual([]);
});

test("writing respects reduced motion and keyboard navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: /My opinionated guide/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".writing-content h1")).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("animation-name", "none");
});
