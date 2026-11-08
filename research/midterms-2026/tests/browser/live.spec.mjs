import { test, expect } from "@playwright/test";
import fs from "node:fs";

const predictions = JSON.parse(
  fs.readFileSync(
    new URL("../../website/live/predictions.json", import.meta.url),
  ),
);
const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../../data/results/live-snapshot.json", import.meta.url),
  ),
);
function payload(chamber) {
  return {
    test_data: false,
    country: "US",
    election_scope: "General",
    election_type:
      chamber === "house" ? "House of Representatives" : "US Senate",
    election_date: "2026-11-03T05:00:00Z",
    last_updated: snapshot[chamber].updatedAt,
    region_results: Object.fromEntries(
      predictions.races
        .filter((r) => r.chamber === chamber)
        .map((f) => {
          const r = snapshot[chamber].races[f.id];
          return [
            (chamber === "house" ? f.label : f.state).toLowerCase(),
            {
              name: r.name,
              percent_reporting: r.reporting,
              candidates: r.candidates.map((c) => ({
                ...c,
                party: c.sourceParty,
              })),
            },
          ];
        }),
    ),
  };
}

test("live comparison refreshes, filters, preserves estimates and survives outages", async ({
  page,
}, testInfo) => {
  let failure = false,
    change = false,
    requests = 0;
  await page.clock.install({ time: new Date("2026-11-08T12:00:00Z") });
  await page.route("https://civicapi.org/api/v2/race/*", async (route) => {
    requests++;
    if (failure) return route.fulfill({ status: 503, body: "Unavailable" });
    const chamber = route.request().url().endsWith("87524")
      ? "house"
      : "senate";
    const data = payload(chamber);
    if (change && chamber === "senate") {
      data.last_updated = "2026-11-08T12:01:00Z";
      data.region_results.ms.candidates[0].winner = true;
    }
    return route.fulfill({
      json: data,
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.goto("/");
  const widget = page.locator("#live-results-comparison");
  await expect(widget.getByRole("status")).toContainText("Checked");
  await expect(widget.locator(".metrics")).toContainText("399 / 413");
  await expect(widget.locator("tbody tr")).toHaveCount(10);
  await expect(widget.locator(".pages")).toContainText("1–10 of 435 races");
  await widget.getByRole("button", { name: "Senate · 35 contests" }).click();
  await expect(widget.locator(".metrics")).toContainText("31 / 33");
  await expect(widget.locator(".metrics")).toContainText("3.32 pp");
  await widget.getByLabel("Filter races").selectOption("misses");
  await expect(widget.locator("tbody tr")).toHaveCount(2);
  await expect(widget.locator("tbody")).toContainText("IA");
  await expect(widget.locator("tbody")).toContainText("SC");
  await widget.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("live-senate.png") });
  await widget.getByLabel("Filter races").selectOption("all");
  await widget.getByLabel("Find a race").fill("Mississippi");
  await expect(widget.locator("tbody tr")).toHaveCount(1);
  await widget.getByLabel("Find a race").fill("Colom");
  await expect(widget.locator("tbody tr")).toHaveCount(1);
  await expect(widget.locator("tbody")).toContainText("Uncalled");
  change = true;
  const before = requests;
  await page.clock.fastForward(61000);
  await expect.poll(() => requests).toBeGreaterThan(before);
  await expect(widget.locator(".metrics")).toContainText("31 / 34");
  await expect(widget.locator(".seats")).toContainText("18 D");
  await expect(widget.locator(".seats")).toContainText("21 D");
  failure = true;
  await widget
    .getByRole("button", { name: "Refresh results", exact: true })
    .click();
  await expect(widget.getByRole("status")).toContainText("Refresh failed");
  await expect(widget.locator(".metrics")).toContainText("31 / 34");
  await page.reload();
  await expect(widget.getByRole("status")).toContainText("Refresh failed");
  await widget.getByRole("button", { name: "Senate · 35 contests" }).click();
  await expect(widget.locator(".metrics")).toContainText("31 / 34");
  await expect(widget.locator(".seats")).toContainText("18 D");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await widget.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("live-outage.png") });
});
