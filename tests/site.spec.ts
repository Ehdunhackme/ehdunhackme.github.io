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
  const details = page.locator("#platonic-representation .paper-explanation");
  const toggle = details.getByRole("button", { name: "AI summary" });
  const panel = details.locator(".paper-explanation-panel");
  await toggle.focus();
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute(
    "aria-controls",
    (await panel.getAttribute("id")) as string,
  );
  await expect(
    details.getByText("Layerwise alignment and transfer"),
  ).toBeVisible();
  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
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

test("directory views preserve search and keep summaries accessible", async ({
  page,
}) => {
  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
  const compact = page.getByRole("button", {
    name: "Compact view",
    exact: true,
  });
  const detailed = page.getByRole("button", {
    name: "Detailed view",
    exact: true,
  });
  const search = page.getByRole("searchbox");
  await search.fill("election");
  await expect(page.locator(".writing-card-list > li:visible")).toHaveCount(1);
  await compact.focus();
  await compact.press("Enter");
  await expect(compact).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".writing-card-list > li:visible")).toHaveCount(1);
  await expect(
    page.locator(".writing-section-description").first(),
  ).toBeHidden();
  await expect(page.locator(".writing-date-short").first()).toBeVisible();
  await detailed.click();
  await expect(search).toHaveValue("election");
  await expect(
    page.locator(".writing-section-description").first(),
  ).toBeVisible();
  await search.press("Escape");
  await expect(page.locator(".writing-card-list > li:visible")).toHaveCount(2);

  await page.goto("/projects/");
  await page.waitForLoadState("networkidle");
  await search.fill("shared geometry");
  await compact.click();
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(1);
  const project = page.locator("#platonic-representation");
  await expect(project.locator(".paper-thumbnail")).toBeHidden();
  const summary = project.getByRole("button", { name: "AI summary" });
  await summary.click();
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await expect(
    project.getByText("Layerwise alignment and transfer"),
  ).toBeVisible();
  await detailed.click();
  await expect(project.locator(".paper-thumbnail")).toBeVisible();
  await expect(summary).toHaveAttribute("aria-expanded", "true");
});

test("directory transitions can reverse and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
  const directory = page.locator(".directory-page");
  const content = page.locator(".directory-view-content");
  const detailed = page.getByRole("button", {
    name: "Detailed view",
    exact: true,
  });
  const compact = page.getByRole("button", {
    name: "Compact view",
    exact: true,
  });
  await page.getByRole("searchbox").fill("election");

  // Freeze halfway through the departure, then reverse before the layout swaps.
  const halfwayOpacity = await page.evaluate(() => {
    (
      document.querySelector('[aria-label="Compact view"]') as HTMLButtonElement
    ).click();
    const results = document.querySelector(".directory-view-content")!;
    const animation = results.getAnimations()[0];
    animation.pause();
    animation.currentTime = 50;
    return Number(getComputedStyle(results).opacity);
  });
  expect(halfwayOpacity).toBeGreaterThan(0);
  expect(halfwayOpacity).toBeLessThan(1);
  await detailed.click();
  await expect(directory).toHaveAttribute("data-view", "detailed");
  await expect(content).toHaveCSS("opacity", "1");

  await compact.click();
  await expect(directory).toHaveAttribute("data-view", "compact");
  await expect(content).toHaveCSS("opacity", "1");
  await expect(page.getByRole("searchbox")).toHaveValue("election");
  await expect(page.locator(".writing-card-list > li:visible")).toHaveCount(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await detailed.click();
  await expect(directory).toHaveAttribute("data-view", "detailed");
  expect(
    await content.evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await expect(content).toHaveCSS("opacity", "1");
});

test("directory spotlight follows entries without underlining writing titles", async ({
  page,
  isMobile,
}) => {
  for (const route of ["/writings/", "/projects/"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const scope = page.locator(".directory-view-content");
    const entries = scope.locator("[data-focus-item]");
    const first = entries.nth(0);
    const second = entries.nth(1);
    for (const view of ["Detailed view", "Compact view"]) {
      await page.getByRole("button", { name: view, exact: true }).click();
      await expect(page.locator(".directory-page")).toHaveAttribute(
        "data-view",
        view === "Detailed view" ? "detailed" : "compact",
      );
      if (isMobile) {
        await first.dispatchEvent("pointerover", { pointerType: "touch" });
        await expect(scope.locator("[data-focus-selected]")).toHaveCount(0);
        await expect(second).toHaveCSS("opacity", "1");
      } else {
        await first.hover();
        await expect(first).toHaveCSS("opacity", "1");
        await expect(second).toHaveCSS("opacity", "0.28");
        await second.hover();
        await expect(scope.locator("[data-focus-selected]")).toHaveCount(1);
        await expect(second).toHaveAttribute("data-focus-selected", "");
        await expect(first).toHaveCSS("opacity", "0.28");
        if (route === "/writings/") {
          await expect(second.locator(".writing-section-title")).toHaveCSS(
            "text-decoration-line",
            "none",
          );
        }
        await page.mouse.move(1, 1);
        await expect(scope.locator("[data-focus-selected]")).toHaveCount(0);
        await expect(first).toHaveCSS("opacity", "1");
      }
    }
    // A keyboard user gets the same emphasis and filtering clears the old item.
    await page.mouse.move(1, 1);
    await page.keyboard.press("Tab");
    const link = first.locator("a").first();
    if (await link.count()) {
      await link.focus();
      await expect(first).toHaveAttribute("data-focus-selected", "");
      await expect(second).toHaveCSS("opacity", "0.28");
      if (route === "/writings/") {
        await expect(first.locator(".writing-section-title")).toHaveCSS(
          "text-decoration-line",
          "none",
        );
      }
    }
    await page.getByRole("searchbox").fill("qwerty");
    await expect(scope.locator("[data-focus-selected]")).toHaveCount(0);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(first).toHaveCSS("opacity", "1");
  }
});

test("writings search and dark layouts at viewport width", async ({ page }) => {
  await page.goto("/writings/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("searchbox").fill("qwerty");
  await expect(
    page.getByRole("heading", { name: "No matching writings" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".writing-section-link")).toHaveCount(2);
  await expect(page.locator(".writing-section-link").first()).toBeVisible();
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("#theme-toggle")).toHaveCount(0);
  for (const path of [
    "/",
    "/about/",
    "/projects/",
    "/writings/",
    "/writings/2026-us-midterm-election-model/",
    "/writings/my-opinionated-guide-to-starting-research-early/",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".site-header")).toBeVisible();
    const nonSansHeadings = await page
      .locator("h1, h2, .writing-date, .timeline-date")
      .evaluateAll((elements) =>
        elements
          .filter(
            (el) =>
              el.getClientRects().length &&
              /jetbrains|monospace/i.test(getComputedStyle(el).fontFamily),
          )
          .map((el) => el.textContent),
      );
    expect(nonSansHeadings).toEqual([]);
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
