
import { test, expect } from "@playwright/test";

test("a recorded expense appears in live analytics", async ({
  page,
}) => {
  // 1. Open Transactions page
  await page.goto("/transactions");

  // 2. Open Add Transaction dialog
  await page
    .getByRole("button", { name: "Add Transaction" })
    .click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  // 3. Enter expense details
  await dialog
    .getByLabel("Amount (NPR)", { exact: true })
    .fill("132.45");

  await dialog
    .getByLabel("Category", { exact: true })
    .selectOption("food");

  await dialog
    .getByLabel("Description (optional)")
    .fill("Analytics Test Expense");

  // 4. Save transaction
  await dialog
    .getByRole("button", { name: "Save Transaction" })
    .click();

  // 5. Verify transaction was created
  await expect(
    page.getByText("Analytics Test Expense", {
      exact: true,
    })
  ).toBeVisible();

  // 6. Navigate to Analytics page
  await page.goto("/analytics");

  // 7. Verify the Analytics page heading
  await expect(
    page.getByRole("heading", {
      name: "Analytics",
      level: 1,
    })
  ).toBeVisible();

  // 8. Verify live analytics components
  await expect(
    page.getByText("Income vs Expenses")
  ).toBeVisible();

  await expect(
    page.getByText("Spending by Category")
  ).toBeVisible();

  // 9. Verify expense category is displayed
  await expect(
    page.getByText("Food & Drinks", {
      exact: true,
    })
  ).toBeVisible();
});
