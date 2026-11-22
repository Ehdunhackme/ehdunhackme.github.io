import { expect, test } from "@playwright/test";

test("the article exposes its recorded comparisons, matched trials and study data", async ({
  page,
  request,
}) => {
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("arcbench");
  await page.getByRole("link", { name: /Robot path learning with an SO-101 arm/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Robot path learning with an SO-101 arm",
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
  const explorer = page.getByRole("button", { name: "Explore in 3D" });
  await expect(explorer).toHaveAttribute("aria-pressed","true");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#stage")).toBeVisible();
  await frame.getByText("Advanced settings", {exact:true}).click();
  await expect(frame.getByRole("slider", {name:/Opening width/})).toHaveValue("110");
  await expect(frame.getByRole("slider", {name:/Inspection depth/})).toHaveValue("75");
  await expect(frame.getByRole("combobox", {name:"Camera",exact:true})).toBeVisible();
  await expect(frame.getByRole("button", {name:"Randomize layout"})).toBeAttached();
  await expect(page.getByRole("group",{name:"Collision classification loss"})).toBeAttached();
  await expect(page.getByRole("group",{name:"Nearest-neighbor push selection"})).toBeAttached();
  await page.getByRole("button", { name: "Video", exact:true }).click();
  await page.getByRole("button", { name: "Play Shelf inspection comparison" }).click();
  await expect(page.locator("video source")).toHaveAttribute("src",/shelf\.mp4$/);
  await explorer.click();
  await expect(frame.getByRole("slider", {name:/Opening width/})).toBeVisible();
  const data = await request.get("/assets/writings/arcbench/puck-trials.csv");
  expect(data.ok()).toBeTruthy();
  expect((await data.text()).trim().split(/\r?\n/)).toHaveLength(385);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
