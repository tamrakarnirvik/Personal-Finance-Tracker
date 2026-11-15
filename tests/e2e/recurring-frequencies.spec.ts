
import {
  expect,
  test,
} from "@playwright/test";

test(
  "weekly schedule displays multiple occurrences in one month",
  async ({ page }) => {
    await page.goto("/recurring");

    const editor = page.getByRole(
      "region",
      {
        name: "Recurring schedule editor",
      }
    );

    await editor
      .getByLabel("Name", {
        exact: true,
      })
      .fill("QA Weekly Payment");

    await editor
      .getByLabel("Frequency")
      .selectOption("weekly");

    await editor
      .getByLabel("First due date")
      .fill("2026-10-01");

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
      .fill("175");

    await editor
      .getByRole("button", {
        name: "Save schedule",
      })
      .click();

    await page
      .getByLabel("View month")
      .fill("2026-11");

    const occurrences = page
      .getByRole("region", {
        name: "Monthly recurring occurrences",
      })
      .locator("article")
      .filter({
        hasText: "QA Weekly Payment",
      });

    // Nov 5, 12, 19 and 26.
    await expect(
      occurrences
    ).toHaveCount(4);

    const savedFrequency =
      await page.evaluate(() => {
        const stored = JSON.parse(
          localStorage.getItem(
            "expense-tracker-recurring-v1"
          ) ?? "[]"
        ) as {
          name: string;
          frequency?: string;
        }[];

        return stored.find(
          (item) =>
            item.name === "QA Weekly Payment"
        )?.frequency;
      });

    expect(
      savedFrequency
    ).toBe("weekly");
  }
);

test(
  "yearly schedule appears only in its anniversary month",
  async ({ page }) => {
    await page.goto("/recurring");

    const editor = page.getByRole(
      "region",
      {
        name: "Recurring schedule editor",
      }
    );

    await editor
      .getByLabel("Name", {
        exact: true,
      })
      .fill("QA Yearly Renewal");

    await editor
      .getByLabel("Frequency")
      .selectOption("yearly");

    await editor
      .getByLabel("First due date")
      .fill("2025-11-05");

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
      .fill("1200");

    await editor
      .getByRole("button", {
        name: "Save schedule",
      })
      .click();

    const panel = page.getByRole(
      "region",
      {
        name: "Monthly recurring occurrences",
      }
    );

    await page
      .getByLabel("View month")
      .fill("2026-11");

    await expect(
      panel
        .locator("article")
        .filter({
          hasText: "QA Yearly Renewal",
        })
    ).toHaveCount(1);

    await page
      .getByLabel("View month")
      .fill("2026-12");

    await expect(
      panel
        .locator("article")
        .filter({
          hasText: "QA Yearly Renewal",
        })
    ).toHaveCount(0);
  }
);
