
import {
  expect,
  test,
} from "@playwright/test";

import {
  readFile,
} from "node:fs/promises";

// ==========================================
// REPORT FILTER AND CSV TEST
// ==========================================

test(
  "filters financial reports and downloads the transaction CSV",
  async ({ page }) => {
    await page.goto("/reports");

    await expect(
      page.getByRole("heading", {
        name: "Financial Reports",
      })
    ).toBeVisible();

    const filters = page.getByRole(
      "region",
      {
        name: "Financial report filters",
      }
    );

    // Select custom dates.

    await filters
      .getByLabel("Reporting period")
      .selectOption("custom");

    await filters
      .getByLabel("From date")
      .fill("2026-01-01");

    await filters
      .getByLabel("To date")
      .fill("2026-12-31");

    // Select expenses.

    await filters
      .getByLabel("Transaction type")
      .selectOption("expense");

    // Verify report sections.

    await expect(
      page.getByRole("region", {
        name: "Financial report summary",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("region", {
        name:
          "Financial transaction statement",
      })
    ).toBeVisible();

    // Download CSV.

    const downloadPromise =
      page.waitForEvent("download");

    await page
      .getByRole("button", {
        name: "Transactions CSV",
      })
      .click();

    const download =
      await downloadPromise;

    expect(
      download.suggestedFilename()
    ).toBe(
      "expense-tracker-transactions-2026-01-01-to-2026-12-31.csv"
    );

    const path =
      await download.path();

    if (!path) {
      throw new Error(
        "Playwright download path is missing."
      );
    }

    const content =
      await readFile(
        path,
        "utf8"
      );

    expect(content).toContain(
      "Transaction ID"
    );

    expect(content).toContain(
      "Amount NPR"
    );
  }
);

// ==========================================
// PRINTABLE REPORT TEST
// ==========================================

test(
  "opens the printable report to save as a PDF",
  async ({ page }) => {
    await page.goto("/reports");

    await expect(
      page.getByRole("heading", {
        name: "Financial Reports",
      })
    ).toBeVisible();

    const popupPromise =
      page.waitForEvent("popup");

    await page
      .getByRole("button", {
        name: "Print / Save as PDF",
      })
      .click();

    const popup =
      await popupPromise;

    await popup.waitForLoadState(
      "domcontentloaded"
    );

    await expect(
      popup.getByRole("heading", {
        name: "Financial report",
      })
    ).toBeVisible();

    await expect(
      popup.getByRole("button", {
        name: "Print / Save as PDF",
      })
    ).toBeVisible();

    await popup.close();
  }
);
