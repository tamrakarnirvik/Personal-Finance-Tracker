import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("current complete backup retains recurring schedules from phase 9", async ({ page }) => {
  await page.goto("/recurring");

  const editor = page.getByRole("region", { name: "Recurring schedule editor" });
  await editor.getByLabel("Name", { exact: true }).fill("QA Backup Subscription");
  await editor.getByLabel("First due date").fill("2026-11-05");
  await editor.getByLabel("Account", { exact: true }).selectOption({ index: 1 });
  await editor.getByLabel("Category", { exact: true }).selectOption({ label: "Food & Drinks" });
  await editor.getByLabel("Amount (NPR)").fill("1500");
  await editor.getByRole("button", { name: "Save schedule" }).click();

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download complete backup" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error("Download path is unavailable");

  const backup = JSON.parse(await readFile(path, "utf8"));

  // The app exports v4; older recurring data must still be present.
  expect(backup.version).toBe(4);
  expect(backup.data.recurring).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "QA Backup Subscription",
        amountPaisa: 150000,
      }),
    ]),
  );
  expect(backup.storage["expense-tracker-recurring-v1"]).toContain(
    "QA Backup Subscription",
  );
  expect(backup.data.goals).toMatchObject({
    version: 1,
    goals: expect.any(Array),
    movements: expect.any(Array),
  });
});
