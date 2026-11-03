import { test, expect } from "@playwright/test";

test("navigation retains the document and header, with the active link highlighted", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
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
  await page.waitForLoadState("networkidle");
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

test("about chapters, browser history, legacy links and gallery work", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("timeline-gallery");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main .about-link-list")).toHaveCount(0);
  await expect(page.locator("main #about-reader")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "More about me" })
    .click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator(".site-header [aria-current=page]")).toHaveText(
    "More about me",
  );
  await expect(page.locator("#more-about-me")).toBeVisible();
  const index = page.getByRole("navigation", { name: "About sections" });
  await index.getByRole("link", { name: "Motivations", exact: true }).click();
  await expect(page.locator("#motivations")).toBeVisible();
  await expect(page.locator("#more-about-me")).toBeHidden();
  await expect(page.locator("#motivation-education")).toBeVisible();
  await expect(page.locator("#motivation-ai")).toBeVisible();
  await expect(page.locator(".motivation-priorities")).toHaveCount(0);
  await index
    .getByRole("link", { name: "Honours & awards", exact: true })
    .click();
  await expect(page.locator("#honours")).toBeVisible();
  await expect(page.locator("#motivations")).toBeHidden();
  await expect(page.locator(".about-reader > section:visible")).toHaveCount(1);
  await page.goBack();
  await expect(page.locator("#motivations")).toBeVisible();
  await page.goForward();
  await expect(page.locator("#honours")).toBeVisible();
  await page.reload();
  await expect(page.locator("#honours")).toBeVisible();
  await page.goto("/#more-about-me");
  await expect(page).toHaveURL(/\/about\/#more-about-me$/);
  await page.waitForLoadState("networkidle");
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
  await page.goto("/about/#motivation-ai");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#motivations")).toBeVisible();
  await expect(page.locator("#motivation-ai")).toBeInViewport();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect(page.locator(".home-introduction")).toBeVisible();
  await page.locator(".journey-link").click();
  await expect(page).toHaveURL(/\/about\/#more-about-me$/);
  await expect(page.locator("#more-about-me")).toBeVisible();
});

test("writings search, theme persistence and layouts at viewport width", async ({
  page,
}) => {
  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
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
    "/about/",
    "/projects/",
    "/writings/",
    "/writings/my-opinionated-guide-to-starting-research-early/",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
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
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/projects\/#platonic-representation$/);
  await expect(page.locator("#platonic-representation")).toBeVisible();
  await page.goto("/about/index.html#motivations");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/about\/#motivations$/);
  await expect(page.locator("#motivations")).toBeVisible();
  await page.goto("/papers/");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/projects\/#papers-heading$/);
});

test("reduced motion disables page and chapter animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about/");
  await page.waitForLoadState("networkidle");
  expect(
    await page.locator("main").evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  const link = page
    .getByRole("navigation", { name: "About sections" })
    .getByRole("link", { name: "Motivations", exact: true });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#motivations")).toBeVisible();
  await expect(page.locator("#motivations-heading")).toBeFocused();
  expect(
    await page
      .locator("#motivations")
      .evaluate((el) => el.getAnimations().length),
  ).toBe(0);
});
