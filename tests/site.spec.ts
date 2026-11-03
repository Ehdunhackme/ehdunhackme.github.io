import { test, expect } from "@playwright/test";

test("navigation retains the document and header, with the active link highlighted", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).navigationMarker =
      "same-document";
  });
  const header = page.locator(".site-header");
  await expect(header.locator('[aria-current="page"]')).toHaveText("Home");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Projects" })
    .click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(
    page.getByRole("heading", { name: "my project board." }),
  ).toBeVisible();
  await expect(header.locator('[aria-current="page"]')).toHaveText("Projects");
  expect(
    await page.evaluate(
      () => (window as unknown as Record<string, unknown>).navigationMarker,
    ),
  ).toBe("same-document");
  expect(await header.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(header.locator('[aria-current="page"]')).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(header.getByRole("link", { name: "Home" })).toHaveCSS(
    "color",
    "rgb(150, 150, 150)",
  );
  await header.getByRole("link", { name: "Writings" }).click();
  await page.getByRole("link", { name: /My opinionated guide/ }).click();
  await expect(page.locator(".writing-content")).toBeVisible();
  await expect(header.locator('[aria-current="page"]')).toHaveText("Writings");
  expect(errors).toEqual([]);
});

test("project content is pre-rendered, searchable, and explanations animate both ways", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/projects/")).text();
  expect(html).toContain("Layerwise alignment and transfer");
  expect(html).toContain("paper-thumbnail");
  await page.goto("/projects/");
  const entries = page.locator(".paper-list > li");
  await expect(entries).toHaveCount(16);
  const search = page.getByRole("searchbox");
  await search.fill("chert");
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(1);
  await expect(page.locator("#chert")).toBeVisible();
  await expect(page.locator("#chert .project-title-link")).toHaveCSS(
    "color",
    "rgb(138, 180, 255)",
  );
  await expect(page.locator("#chert .project-thumbnail")).toHaveCSS(
    "border-top-width",
    "0px",
  );
  await search.fill("no-such-paper-qwerty");
  await expect(
    page.getByRole("heading", { name: "No matching projects or papers" }),
  ).toBeVisible();
  await search.press("Escape");
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(16);
  const details = page.locator("#platonic-representation details");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details).not.toHaveClass(/is-animating/);
  await expect(
    details.getByText("Layerwise alignment and transfer"),
  ).toBeVisible();
  await details.locator("summary").click();
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await details.locator("summary").click();
  await expect(details).not.toHaveAttribute("open", "");
});

test("all three cards, browser back/forward, deep links and gallery work", async ({
  page,
}) => {
  await page.goto("/#about-deck");
  for (const [id, label] of [
    ["more-about-me", "My journey timeline"],
    ["motivations", "My motivations"],
    ["honours", "Honours & awards"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("#about-reader")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator(".home-intro-content")).toBeHidden();
    await page.goBack();
    await expect(page.locator("#about-reader")).toBeHidden();
    await expect(page.locator("#about-deck")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.locator(".home-introduction")).toBeVisible();
  }
  await page.goForward();
  await expect(page.locator("#honours")).toBeVisible();
  await page.goto("/#more-about-me");
  await expect(page.locator("#more-about-me")).toBeVisible();
  const gallery = page.locator(".timeline-gallery").first();
  await gallery.getByRole("button", { name: "Next image" }).click();
  await expect(gallery.locator(".timeline-gallery-position")).toHaveText(
    "2 / 14",
  );
  await gallery.locator(".timeline-gallery-item").nth(1).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#more-about-me")).toBeVisible();
  await page
    .getByRole("button", { name: "Back to the cards", exact: false })
    .click();
  await expect(page.locator("#about-deck")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.locator(".journey-link").click();
  await expect(page.locator("#more-about-me")).toBeVisible();
});

test("writings search, theme persistence and layouts at viewport width", async ({
  page,
}) => {
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("qwerty");
  await expect(
    page.getByRole("heading", { name: "No matching writings" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".writing-section-link")).toBeVisible();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  for (const path of [
    "/",
    "/projects/",
    "/writings/",
    "/writings/my-opinionated-guide-to-starting-research-early/",
  ]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".site-header")).toBeVisible();
  }
});

test("old HTML URLs and alternate routes redirect without losing anchors", async ({
  page,
}) => {
  await page.goto("/projects/index.html#platonic-representation");
  await expect(page).toHaveURL(/\/projects\/#platonic-representation$/);
  await expect(page.locator("#platonic-representation")).toBeVisible();
  await page.goto("/about/index.html#motivations");
  await expect(page).toHaveURL(/\/#motivations$/);
  await expect(page.locator("#motivations")).toBeVisible();
  await page.goto("/papers/");
  await expect(page).toHaveURL(/\/projects\/#papers-heading$/);
});

test("reduced motion disables entrance and card animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.locator("main").evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await page
    .getByRole("button", { name: "My motivations", exact: true })
    .click();
  await expect(page.locator("#about-reader")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(
    await page
      .locator("#about-reader")
      .evaluate((el) => el.getAnimations().length),
  ).toBe(0);
});
