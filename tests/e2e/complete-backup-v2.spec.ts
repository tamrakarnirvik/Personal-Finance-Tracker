
import {
  expect,
  test,
} from "@playwright/test";

import {
  readFile,
} from "node:fs/promises";

test(
  "complete backup includes recurring schedules",
  async ({ page }) => {
    // Open the recurring schedules page.
    await page.goto("/recurring");

    const editor = page.getByRole(
      "region",
      {
        name:
          "Recurring schedule editor",
      }
    );

    // Create a test recurring expense.
    await editor
      .getByLabel("Name", {
        exact: true,
      })
      .fill(
        "QA Backup Subscription"
      );

    await editor
      .getByLabel("First due date")
      .fill("2026-11-05");

    await editor
      .getByLabel("Account", {
        exact: true,
      })
      .selectOption({
        index: 1,
      });

    await editor
      .getByLabel("Category", {
        exact: true,
      })
      .selectOption({
        label: "Food & Drinks",
      });

    await editor
      .getByLabel("Amount (NPR)")
      .fill("1500");

    await editor
      .getByRole("button", {
        name: "Save schedule",
      })
      .click();

    // Navigate to Settings.
    await page.goto("/settings");

    // Download the complete backup.
    const downloadPromise =
      page.waitForEvent("download");

    await page
      .getByRole("button", {
        name: "Download complete backup",
      })
      .click();

    const download =
      await downloadPromise;

    const path =
      await download.path();

    if (!path) {
      throw new Error(
        "Download path is unavailable"
      );
    }

    // Read and verify the downloaded JSON.
    const file = JSON.parse(
      await readFile(
        path,
        "utf8"
      )
    );

    expect(
      file.version
    ).toBe(2);

    expect(
      file.data.recurring
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name:
            "QA Backup Subscription",
          amountPaisa: 150000,
        }),
      ])
    );

    expect(
      file.storage[
        "expense-tracker-recurring-v1"
      ]
    ).toContain(
      "QA Backup Subscription"
    );
  }
);
