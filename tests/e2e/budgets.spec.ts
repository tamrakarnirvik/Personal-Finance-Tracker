
import { expect, test } from "@playwright/test";

test(
  "create and retain a monthly category budget",
  async ({ page }) => {
    await page.goto("/budgets");

    await expect(
      page.getByRole("heading", {
        name: "Budgets",
        level: 1,
      })
    ).toBeVisible();

    await page
      .getByLabel("Expense category")
      .selectOption({
        label: "Food & Drinks",
      });

    await page
      .getByLabel("Monthly limit (NPR)")
      .fill("5000.00");

    await page
      .getByRole("button", {
        name: "Save budget",
      })
      .click();

    await expect(
      page.getByRole("progressbar", {
        name: "Food & Drinks budget used",
      })
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole("progressbar", {
        name: "Food & Drinks budget used",
      })
    ).toBeVisible();
  }
);
