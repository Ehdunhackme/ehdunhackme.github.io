import { test, expect } from "@playwright/test";

test("project sections switch like About and retain history and deep links", async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects/");
  await page.waitForLoadState("networkidle");
  const index = page.getByRole("navigation", { name: "Project sections" });
  const sections = page.locator(".directory-group:visible");
  await expect(sections).toHaveCount(1);
  await expect(index.locator("[aria-current]")).toHaveText("Publications");
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(10);

  for (const [label, id, count] of [
    ["Acknowledgements", "project-acknowledgements", 1],
    ["Projects", "project-builds", 6],
  ] as const) {
    await index.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(sections).toHaveCount(1);
    await expect(page.locator(".paper-list > li:visible")).toHaveCount(count);
    await expect(index.locator("[aria-current]")).toHaveText(label);
    await expect(index.locator("[aria-current]")).toHaveCSS(
      "color",
      "rgb(245, 245, 245)",
    );
    await expect(sections).toHaveCSS("animation-name", "about-chapter-reveal");
    await expect(sections.locator("h2")).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const active = index.locator("[aria-current]");
  await expect(active).toHaveCSS(
    isMobile ? "border-bottom-width" : "border-left-width",
    "2px",
  );
  const sidebar = (await index.boundingBox())!;
  const content = (await sections.boundingBox())!;
  if (isMobile) expect(content.y).toBeGreaterThan(sidebar.y + sidebar.height);
  else expect(content.x).toBeGreaterThan(sidebar.x + sidebar.width);

  await page.goBack();
  await expect(index.locator("[aria-current]")).toHaveText("Acknowledgements");
  await page.goForward();
  await expect(index.locator("[aria-current]")).toHaveText("Projects");
  await page.reload();
  await expect(index.locator("[aria-current]")).toHaveText("Projects");
  await page.goto("/projects/#epecscan");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#epecscan")).toBeInViewport();
  await expect(index.locator("[aria-current]")).toHaveText("Projects");
  await page.goto("/projects/#acknowledgements-heading");
  await expect(index.locator("[aria-current]")).toHaveText("Acknowledgements");
  await expect(page.locator("#acknowledgements-heading")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("section switching preserves summaries and global search reaches all groups", async ({
  page,
}) => {
  await page.goto("/projects/#project-builds");
  await page.waitForLoadState("networkidle");
  const index = page.getByRole("navigation", { name: "Project sections" });
  const summary = page
    .locator("#chert")
    .getByRole("button", { name: "LLM explanation" });
  await summary.click();
  await index.getByRole("link", { name: "Publications", exact: true }).click();
  await expect(
    page.locator(".directory-view-content [data-focus-selected]"),
  ).toHaveCount(0);
  await index.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Compact view" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-view", "compact");
  const search = page.getByRole("searchbox");
  await search.fill("platonic");
  await expect(page.locator(".directory-group:visible")).toHaveCount(2);
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(2);
  await expect(page.getByRole("status")).toHaveText("2 of 17 entries");
  await expect(index.locator("[aria-current]")).toHaveCount(0);
  await search.press("Escape");
  await expect(index.locator("[aria-current]")).toHaveText("Projects");
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await search.fill("qwerty");
  await expect(
    page.getByRole("heading", { name: "No matching projects or papers" }),
  ).toBeVisible();
  await index.getByRole("link", { name: "Publications", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".paper-list > li:visible")).toHaveCount(10);
  await expect(page.locator("main")).toHaveAttribute("data-view", "compact");
});

test("section links work by keyboard, tolerate fast switching and respect reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/");
  await page.waitForLoadState("networkidle");
  const index = page.getByRole("navigation", { name: "Project sections" });
  await index.getByRole("link", { name: "Projects", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#projects-heading")).toBeFocused();
  await expect(page.locator(".directory-group:visible")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await index.evaluate((nav) => {
    const links = nav.querySelectorAll<HTMLAnchorElement>("a");
    for (const position of [0, 1, 2, 0, 2]) links[position].click();
  });
  await expect(page.locator(".directory-group:visible")).toHaveCount(1);
  await expect(index.locator("[aria-current]")).toHaveText("Acknowledgements");
  await expect(page.locator(".directory-group:visible")).toHaveCSS(
    "opacity",
    "1",
  );
});
