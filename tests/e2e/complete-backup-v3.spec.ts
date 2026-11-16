
import {
  expect,
  test,
} from "@playwright/test";

import {
  readFile,
} from "node:fs/promises";

test(
  "complete backup V3 saves automation preferences and restores with auto-post disabled",
  async ({ page }) => {
    await page.goto("/settings");

    // ======================================
    // SAVE TEST AUTOMATION PREFERENCES
    // ======================================

    await page.evaluate(() => {
      localStorage.setItem(
        "expense-tracker-recurring-automation-v1",
        JSON.stringify({
          autoPostDueToday: true,
          showDashboardWidget: true,
          reminderDaysAhead: 30,
        })
      );
    });

    // ======================================
    // EXPORT COMPLETE BACKUP
    // ======================================

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
        "Download file path unavailable"
      );
    }

    const json =
      await readFile(
        path,
        "utf8"
      );

    const backup =
      JSON.parse(json);

    // ======================================
    // VALIDATE EXPORTED CONTENT
    // ======================================

    expect(
      backup.version
    ).toBe(3);

    expect(
      backup.data.automation
    ).toMatchObject({
      autoPostDueToday: true,
      reminderDaysAhead: 30,
    });

    expect(
      backup.storage
    ).toHaveProperty(
      "expense-tracker-recurring-automation-v1"
    );

    // ======================================
    // UPLOAD BACKUP
    // ======================================

    await page
      .locator(
        "#complete-backup-json"
      )
      .setInputFiles({
        name:
          "test-backup-v3.json",

        mimeType:
          "application/json",

        buffer:
          Buffer.from(json),
      });

    await expect(
      page.getByText(
        "Validated backup · Version 3"
      )
    ).toBeVisible();

    // ======================================
    // DOWNLOAD RECOVERY COPY
    // ======================================

    const recoveryPromise =
      page.waitForEvent("download");

    await page
      .getByRole("button", {
        name:
          "Download current-data recovery copy",
      })
      .click();

    const recovery =
      await recoveryPromise;

    expect(
      await recovery.path()
    ).toBeTruthy();

    // ======================================
    // CONFIRM RESTORATION
    // ======================================

    await page
      .getByLabel(
        "I checked that my recovery JSON file was saved to this device."
      )
      .check();

    await page
      .getByLabel(
        "Type RESTORE to replace current data"
      )
      .fill("RESTORE");

    page.once(
      "dialog",
      (dialog) =>
        dialog.accept()
    );

    await page
      .getByRole("button", {
        name:
          "Restore complete backup",
      })
      .click();

    // ======================================
    // VERIFY AUTO-POSTING IS DISABLED
    // ======================================

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const raw =
              localStorage.getItem(
                "expense-tracker-recurring-automation-v1"
              );

            return raw
              ? JSON.parse(raw)
                  .autoPostDueToday
              : null;
          })
      )
      .toBe(false);
  }
);
