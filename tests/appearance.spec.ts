import { test, expect } from "@playwright/test";

test("content links inherit their text colour and brighten on keyboard focus across pages", async ({
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
    await expect(link).toHaveCSS("color", inherited);
    await page.keyboard.press("Tab");
    await link.focus();
    await expect(link).toHaveCSS("color", "rgb(255, 255, 255)");
  }
});
