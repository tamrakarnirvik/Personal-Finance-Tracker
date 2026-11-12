
import { test, expect } from "@playwright/test";

test("filters expenses by category and date", async ({ page }) => {
  await page.goto("/transactions");

  // Show expenses only.
  await page.getByLabel("Transaction type").selectOption("expense");

  // Filter Food & Drinks.
  await page.getByLabel("Category", { exact: true })
    .selectOption("food");

  await expect(
    page.getByText("Groceries", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Monthly Salary", { exact: true })
  ).toHaveCount(0);

  // Only transactions on or after Nov 4.
  await page.getByLabel("From date").fill("2026-11-04");

  await expect(
    page.getByText("Groceries", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Coffee", { exact: true })
  ).toHaveCount(0);

  // Clear filters.
  await page.getByRole("button", {
    name: "Clear filters",
  }).click();

  await expect(
    page.getByText("Monthly Salary", { exact: true })
  ).toBeVisible();
});

test("searches transaction descriptions", async ({ page }) => {
  await page.goto("/transactions");

  await page.getByLabel("Search").fill("Groceries");

  await expect(
    page.getByText("Groceries", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Coffee", { exact: true })
  ).toHaveCount(0);
});
