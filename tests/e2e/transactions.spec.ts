
import { test, expect } from "@playwright/test";

test("create an expense and show it on the dashboard", async ({
  page,
  isMobile,
}) => {
  // Step 1: Open Transactions
  await page.goto("/transactions");

  // Step 2: Open Add Transaction dialog
  await page
    .getByRole("button", { name: "Add Transaction" })
    .click();

  // Step 3: Target only fields inside the dialog
  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  // Enter transaction amount
  await dialog
    .getByLabel("Amount (NPR)", { exact: true })
    .fill("250.50");

  // Select transaction date
  await dialog
    .getByLabel("Date", { exact: true })
    .fill("2026-11-06");

  // Enter description
  await dialog
    .getByLabel("Description (optional)")
    .fill("Test Lunch");

  // Step 4: Save transaction
  await dialog
    .getByRole("button", { name: "Save Transaction" })
    .click();

  // Step 5: Verify transaction appears
  await expect(
    page.getByText("Test Lunch", { exact: true })
  ).toBeVisible();

  // Step 6: Navigate to Dashboard
  const navName = isMobile
    ? "Mobile navigation"
    : "Main navigation";

  await page
    .getByRole("navigation", { name: navName })
    .getByRole("link", { name: "Dashboard" })
    .click();

  // Step 7: Verify transaction appears on Dashboard
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(
    page.getByText("Test Lunch", { exact: true })
  ).toBeVisible();
});
