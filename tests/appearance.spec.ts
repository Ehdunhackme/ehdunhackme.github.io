import { test, expect } from "@playwright/test";

test("content links use their page colours and brighten on keyboard focus", async ({
  page,
}) => {
  for (const [path, selector] of [
    ["/", ".home-introduction a"],
    ["/about/", ".timeline-entry a"],
    ["/projects/", ".paper-links a"],
    [
      "/writings/my-opinionated-guide-to-starting-research-early/",
      ".writing-content a",
    ],
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const link = page.locator(selector).first();
    await expect(link).toBeVisible();
    const inherited = await link.evaluate(
      (el) => getComputedStyle(el.parentElement!).color,
    );
    // Project resource links have an explicit blue colour in papers.css.
    await expect(link).toHaveCSS(
      "color",
      path === "/projects/" ? "rgb(138, 180, 255)" : inherited,
    );
    await page.keyboard.press("Tab");
    await link.focus();
    await expect(link).toHaveCSS("color", "rgb(255, 255, 255)");
  }
});
