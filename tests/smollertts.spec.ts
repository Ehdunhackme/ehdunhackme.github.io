import { test, expect } from "@playwright/test";

test("SmollerTTS leads Projects and opens the standalone demo", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects/#project-builds");
  const projects = page.locator(
    '[data-project-section="project-builds"] .paper-list > li',
  );
  await expect(projects.first()).toHaveAttribute("id", "smollertts");
  await expect(projects.nth(1)).toHaveAttribute("id", "chert");
  const entry = page.locator("#smollertts");
  await expect(entry.getByRole("img")).toBeVisible();
  await expect(
    entry.getByRole("link", { name: "Hugging Face" }),
  ).toHaveAttribute("href", "https://huggingface.co/dunli5107/SmollerTTS");
  await entry.getByRole("button", { name: "LLM explanation" }).click();
  await expect(entry.locator(".paper-explanation-panel")).toBeVisible();
  await expect(entry.locator(".paper-explanation-body")).toContainText(
    "pretrained HiFi-GAN V2",
  );
  await entry.getByRole("link", { name: "Demo", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/smollertts\/$/);
  await expect(
    page.getByRole("heading", { name: "SmollerTTS Text to speech" }),
  ).toBeVisible();
  const header = await page.locator("header.nav").boundingBox();
  const heading = await page.locator(".page-heading").boundingBox();
  const projectLinks = await page.getByRole("navigation", { name: "Project links" }).boundingBox();
  expect(projectLinks!.y + projectLinks!.height).toBeLessThanOrEqual(header!.y + header!.height);
  expect(heading!.y - (header!.y + header!.height)).toBeGreaterThanOrEqual(16);
  await expect(page.locator("#architecture-diagram svg")).toBeAttached();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://dunlichan.com/projects/smollertts/",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const credits = await request.get("/projects/smollertts/credits.html");
  expect(credits.ok()).toBe(true);
  expect(await credits.text()).toContain("HiFi-GAN");
  const manifest = await (
    await request.get("/projects/smollertts/assets.json")
  ).json();
  expect(manifest.name).toBe("SmollerTTS");
  expect(manifest.parameters).toBe(2808792);
  expect(manifest.files["vocoder.onnx"].bytes).toBe(3743259);
  await page.getByRole("navigation", { name: "Project links" })
    .getByRole("link", { name: "Technical blog", exact: true }).click();
  await expect(page).toHaveURL(/\/writings\/smollertts\/$/);
  await expect(page.locator("article h1")).toContainText("SmollerTTS");
  expect(errors).toEqual([]);
});
