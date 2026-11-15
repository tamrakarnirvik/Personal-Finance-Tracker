
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test(
  "complete backup includes all financial data sections",
  async ({ page }) => {
    await page.goto("/settings");

    const downloadPromise =
      page.waitForEvent("download");

    await page
      .getByRole("button", {
        name: "Download complete backup",
      })
      .click();

    const download = await downloadPromise;

    const filePath = await download.path();

    if (!filePath) {
      throw new Error(
        "Downloaded backup file was not found."
      );
    }

    const content = await readFile(
      filePath,
      "utf8"
    );

    const backup = JSON.parse(content);

    expect(backup.application).toBe(
      "expense-tracker"
    );

    expect(backup.version).toBe(1);

    expect(
      Array.isArray(backup.data.accounts)
    ).toBe(true);

    expect(
      Array.isArray(backup.data.transactions)
    ).toBe(true);

    expect(
      Array.isArray(backup.data.categories)
    ).toBe(true);

    expect(
      Array.isArray(backup.data.budgets)
    ).toBe(true);

    expect(backup.storage).toHaveProperty(
      "expense-tracker-budgets-v1"
    );
  }
);
