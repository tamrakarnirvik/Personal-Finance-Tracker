import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("current complete backup includes all financial data sections", async ({ page }) => {
  await page.goto("/settings");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download complete backup" }).click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/expense-tracker-complete-v4-.*\.json$/);

  const path = await download.path();
  if (!path) throw new Error("Download path is unavailable");

  const backup: unknown = JSON.parse(await readFile(path, "utf8"));
  expect(backup).toMatchObject({
    application: "expense-tracker",
    format: "complete-workspace-backup",
    version: 4,
  });

  const data = (backup as { data: Record<string, unknown> }).data;
  expect(Array.isArray(data.accounts)).toBe(true);
  expect(Array.isArray(data.transactions)).toBe(true);
  expect(Array.isArray(data.categories)).toBe(true);
  expect(Array.isArray(data.budgets)).toBe(true);
  expect(Array.isArray(data.recurring)).toBe(true);
  expect(data.automation).toMatchObject({
    autoPostDueToday: expect.any(Boolean),
    showDashboardWidget: expect.any(Boolean),
    reminderDaysAhead: expect.any(Number),
  });
  expect(data.goals).toMatchObject({
    version: 1,
    goals: expect.any(Array),
    movements: expect.any(Array),
  });
});
