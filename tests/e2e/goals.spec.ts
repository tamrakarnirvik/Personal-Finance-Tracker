
import {
  expect,
  test,
} from "@playwright/test";

import {
  readFile,
} from "node:fs/promises";

test(
  "creates a goal, tracks allocation and exports backup v4",
  async ({ page }) => {
    // Open the Goals page.

    await page.goto("/goals");

    // Create sample goal.

    await page
      .getByLabel("Goal name")
      .fill("QA Emergency Savings");

    await page
      .getByLabel("Target (NPR)")
      .fill("10000");

    await page
      .getByLabel("Already allocated (NPR)")
      .fill("1000");

    await page
      .getByRole("button", {
        name: "Create goal",
      })
      .click();

    // Verify goal appears.

    const progress = page.getByRole(
      "region",
      {
        name:
          "Savings goal progress",
      }
    );

    await expect(
      progress.getByText(
        "QA Emergency Savings"
      )
    ).toBeVisible();

    // Record another Rs. 500 allocation.

    await page
      .getByLabel("Goal", {
        exact: true,
      })
      .selectOption({
        label:
          "QA Emergency Savings",
      });

    await page
      .getByLabel("Amount (NPR)")
      .fill("500");

    await page
      .getByRole("button", {
        name: "Save",
        exact: true,
      })
      .click();

    // Rs. 1,500 / Rs. 10,000 = 15%.

    await expect(
      progress.getByText(
        /15%/
      )
    ).toBeVisible();

    // Open Settings.

    await page.goto("/settings");

    const downloadEvent =
      page.waitForEvent("download");

    await page
      .getByRole("button", {
        name:
          "Download complete backup",
      })
      .click();

    const download =
      await downloadEvent;

    const path =
      await download.path();

    if (!path) {
      throw new Error(
        "Download path was not available"
      );
    }

    // Verify complete backup contents.

    const backup = JSON.parse(
      await readFile(
        path,
        "utf8"
      )
    );

    expect(
      backup.version
    ).toBe(4);

    expect(
      backup.data.goals.goals
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name:
            "QA Emergency Savings",
        }),
      ])
    );

    expect(
      backup.data.goals.movements
    ).toHaveLength(1);
  }
);
