
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

// ==========================================
// COMPLETE BACKUP V4 AUTOMATION TEST
// ==========================================

test(
  "current backup retains automation preferences and disables auto-post after restore",
  async ({ page }) => {
    // ======================================
    // STEP 1: OPEN SETTINGS
    // ======================================

    await page.goto("/settings");

    // Test automation settings using a
    // fresh, disposable Playwright browser
    // context.

    await page.evaluate(() => {
      window.localStorage.setItem(
        "expense-tracker-recurring-automation-v1",
        JSON.stringify({
          autoPostDueToday: true,
          showDashboardWidget: true,
          reminderDaysAhead: 30,
        })
      );
    });

    // ======================================
    // STEP 2: EXPORT COMPLETE BACKUP
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
      await readFile(path, "utf8");

    const backup =
      JSON.parse(json);

    // ======================================
    // STEP 3: VERIFY BACKUP V4
    // ======================================

    // V4 includes automation preferences
    // originally introduced in V3.

    expect(backup.version).toBe(4);

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
    // STEP 4: UPLOAD BACKUP FOR VALIDATION
    // ======================================

    await page
      .locator("#complete-backup-json")
      .setInputFiles({
        name: "test-backup-v4.json",
        mimeType: "application/json",
        buffer: Buffer.from(json),
      });

    await expect(
      page.getByText(
        "Validated backup · Version 4"
      )
    ).toBeVisible();

    // ======================================
    // STEP 5: DOWNLOAD RECOVERY COPY
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
    // STEP 6: CONFIRM RECOVERY FILE
    // ======================================

    await page
      .getByLabel(
        "I verified that my recovery JSON file was saved to this device."
      )
      .check();

    // ======================================
    // STEP 7: CONFIRM RESTORE
    // ======================================

    await page
      .getByLabel(
        "Type RESTORE to replace current data"
      )
      .fill("RESTORE");

    page.once("dialog", (dialog) =>
      dialog.accept()
    );

    // ======================================
    // STEP 8: RESTORE BACKUP
    // ======================================

    await page
      .getByRole("button", {
        name: "Restore complete backup",
      })
      .click();

    // ======================================
    // STEP 9: VERIFY AUTO-POSTING IS OFF
    // ======================================

    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw =
            window.localStorage.getItem(
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
