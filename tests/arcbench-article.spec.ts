import { expect, test } from "@playwright/test";

test("the article exposes its recorded comparisons, matched trials and study data", async ({
  page,
  request,
}) => {
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("arcbench");
  await page.getByRole("link", { name: /Teaching an SO-101 arm/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Teaching an SO-101 arm where to push",
  );
  await expect(
    page.getByRole("combobox", { name: "Paddle offset", exact: true }),
  ).toHaveValue("-24");
  await page
    .getByRole("combobox", { name: "Paddle offset", exact: true })
    .selectOption("0");
  await expect(
    page.getByText("12.52 mm from center", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Sliding friction", exact: true })
    .selectOption("0");
  await expect(
    page
      .locator("figure[aria-label='Paired outcomes by surface friction'] li")
      .nth(1),
  ).toHaveText("Learned only19");
  await page
    .getByText("How much did learning help on the shelf?", { exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: /Completed shelf inspections/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Task", exact: true })
    .selectOption("shelf");
  await page
    .getByRole("button", { name: "Play Shelf inspection comparison" })
    .click();
  const video = page.locator("video");
  await expect(video.locator("source")).toHaveAttribute("src", /shelf\.mp4$/);
  await page.getByRole("button", { name: "Explore in 3D" }).click();
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#stage")).toBeVisible();
  // WebGL can be disabled on CI. The same recorded task must still be accessible there.
  await expect(
    frame
      .getByRole("button", { name: "Play" })
      .and(frame.locator(":enabled"))
      .or(frame.getByRole("link", { name: "Watch the recorded comparison" })),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  const data = await request.get("/assets/writings/arcbench/puck-trials.csv");
  expect(data.ok()).toBeTruthy();
  expect((await data.text()).trim().split(/\r?\n/)).toHaveLength(385);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
