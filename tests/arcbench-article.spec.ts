import { expect, test } from "@playwright/test";

test("a retired task link opens the learned puck replay", async ({page}) => {
  await page.goto("/writings/so101-path-learning/?task=relay#gripper-courses");
  await expect(page).toHaveURL(/\/so101-path-learning\/#replays$/);
  await expect(page.getByRole("combobox", {name:"Task", exact:true})).toHaveValue("puck");
  await expect(page.locator("#replays iframe")).toHaveAttribute("src", /task=puck$/);
});

test("the article exposes its recorded comparisons, matched trials and study data", async ({
  page,
  request,
}) => {
  await page.goto("/writings/");
  await page.getByRole("searchbox").fill("SO-101");
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
  await expect(page).toHaveURL(/so101-path-learning/);
  await expect(page.getByRole("table", {name:"Completed shelf inspections out of 96"})).toBeVisible();
  await expect(page.locator("article details")).toHaveCount(0);
  await expect(page.locator("article figcaption")).toHaveCount(0);
  const curve = page.getByRole("slider", {name:"Inspect training update"});
  await curve.focus();
  await curve.press("Home");
  await expect(curve).toHaveAttribute("aria-valuetext", /Update 0, training 0.7036/);
  await curve.press("ArrowRight");
  await expect(curve).toHaveAttribute("aria-valuetext", /Update 25, training 0.2171/);
  await curve.press("End");
  await expect(curve).toHaveAttribute("aria-valuetext", /Update 1000, training 0.0358, validation 0.0718/);
  await page.getByRole("button", {name:"Zoom to last 500"}).click();
  await curve.press("Home");
  await expect(curve).toHaveAttribute("aria-valuetext", /Update 500, training 0.0548/);
  await page.getByRole("button", {name:"Show full run"}).click();
  await expect(page.getByRole("heading",{name:"Cite this post"})).toBeVisible();
  await expect(page.locator("#ref-planning a")).toHaveText(/MotionBenchMaker/);
  const tasks = page.getByRole("combobox", {name:"Task", exact:true});
  await expect(tasks).toHaveValue("puck");
  await expect(tasks.locator("option")).toHaveText(["Obstacle reach", "Shelf inspection", "Puck push"]);
  expect(await tasks.locator("optgroup").evaluateAll(groups => groups.map(g => g.getAttribute("label"))))
    .toEqual(["Supervised path scoring", "Learned push selection"]);
  const puck = await (await request.get("/assets/writings/arcbench/replay/puck.json")).json();
  expect(puck.learned.frames[0][5]).toHaveLength(7);
  expect(puck.learned.gripped_push_steps).toBe(puck.learned.push_steps);
  expect(puck.learned.push_steps).toBeGreaterThan(0);
  expect(puck.release.gripped_push_steps).toBe(0);
  expect(puck.release.outcome).toBe("contact");
  await page
    .getByRole("combobox", { name: "Task", exact: true })
    .selectOption("shelf");
  const explorer = page.getByRole("button", { name: "Explore in 3D" });
  await expect(explorer).toHaveAttribute("aria-pressed","true");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#stage")).toBeVisible();
  await frame.getByText("Advanced settings", {exact:true}).click();
  await expect(frame.getByRole("checkbox",{name:"Show planned paths"})).toBeChecked();
  await expect(frame.getByRole("slider", {name:/Opening width/})).toHaveValue("110");
  await expect(frame.getByRole("slider", {name:/Inspection depth/})).toHaveValue("75");
  await expect(frame.getByRole("combobox", {name:"Camera",exact:true})).toBeVisible();
  await expect(frame.getByRole("button", {name:"Randomize layout"})).toBeAttached();
  await expect(page.getByRole("group",{name:"Route choice"})).toBeAttached();
  await page.getByRole("button", { name: "Video", exact:true }).click();
  await expect(page.locator("video source")).toHaveAttribute("src",/shelf\.mp4$/);
  await expect(page.getByRole("slider",{name:"Video position"})).toBeVisible();
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
