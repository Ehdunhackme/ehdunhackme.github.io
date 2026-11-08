import { test, expect } from "@playwright/test";

test.use({ trace: { mode: "retain-on-failure", snapshots: false } });

test("article disclosures animate both ways and respect reduced motion", async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  await page.route("https://civicapi.org/api/v2/race/*", (route) =>
    route.abort(),
  );
  await page.goto("/writings/2026-us-midterm-election-model/");
  const details = page.locator("article > details").first();
  await details.scrollIntoViewIfNeeded();
  await expect(details.locator("summary")).toBeVisible();
  const motion = await details.evaluate(async (element: HTMLDetailsElement) => {
    const summary = element.querySelector("summary")!;
    const closed = element.getBoundingClientRect().height;
    summary.click();
    const opening = element.getAnimations();
    const content = element.querySelector(".disclosure-body")!;
    for (const animation of [...opening, ...content.getAnimations()]) {
      animation.pause();
      animation.currentTime = 110;
    }
    const middle = element.getBoundingClientRect().height;
    const fade = Number(getComputedStyle(content).opacity);
    for (const animation of [...opening, ...content.getAnimations()])
      animation.finish();
    await new Promise(requestAnimationFrame);
    const expanded = element.getBoundingClientRect().height;
    summary.click();
    const closing = element.getAnimations();
    const remainsOpenWhileClosing = element.open;
    for (const animation of [...closing, ...content.getAnimations()])
      animation.finish();
    await new Promise(requestAnimationFrame);
    return {
      closed,
      middle,
      expanded,
      fade,
      opening: opening.length,
      closing: closing.length,
      remainsOpenWhileClosing,
      closedAfter: !element.open,
    };
  });
  expect(motion.opening).toBe(1);
  expect(motion.closing).toBe(1);
  expect(motion.middle).toBeGreaterThan(motion.closed);
  expect(motion.middle).toBeLessThan(motion.expanded);
  expect(motion.fade).toBeGreaterThan(0);
  expect(motion.fade).toBeLessThan(1);
  expect(motion.remainsOpenWhileClosing && motion.closedAfter).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const item of await page.locator("article details").all()) {
    const summary = item.locator("summary");
    await summary.press("Enter");
    await expect(item).toHaveAttribute("open", "");
    expect(await item.evaluate((el) => el.getAnimations().length)).toBe(0);
    await summary.press("Enter");
    await expect(item).not.toHaveAttribute("open", "");
  }
  const widget = page.locator("#live-results-comparison");
  for (const selector of [".refresh", ".previous", ".next"]) {
    const style = await widget.locator(selector).evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      border: getComputedStyle(el).borderTopStyle,
      underline: getComputedStyle(el).textDecorationLine,
    }));
    expect(style.height).toBeGreaterThanOrEqual(44);
    expect(style.border).toBe("solid");
    expect(style.underline).toBe("none");
  }
  await widget.locator(".pages").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("article-controls.png") });
});
