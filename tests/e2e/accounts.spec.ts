
import { test, expect } from "@playwright/test";

test("create an account and transfer funds", async ({ page }) => {
  await page.goto("/accounts");

  // Create a new account.
  await page.getByRole("button", {
    name: "Add Account",
  }).click();

  await page.getByLabel("Account name").fill("eSewa Test");

  await page.getByLabel("Account type").selectOption("wallet");

  await page.getByLabel("Opening balance (NPR)").fill("2000");

  await page.getByRole("button", {
    name: "Save Account",
  }).click();

  
await expect(
  page
    .getByRole("region", {
      name: "Account balance overview",
    })
    .getByText("eSewa Test", {
      exact: true,
    })
).toBeVisible();


  // Transfer from cash to the new account.
  await page.getByRole("button", {
    name: "Transfer Money",
  }).click();

  await page.getByLabel("From account").selectOption("cash");

  await page.getByLabel("To account").selectOption({
    label: "eSewa Test",
  });

  await page.getByLabel("Amount (NPR)").fill("100");

  await page.getByRole("button", {
    name: "Complete Transfer",
  }).click();

  // Verify transfer history.
  await expect(
    page.getByText("Cash Wallet → eSewa Test")
  ).toBeVisible();

  // Verify the transfer survives a refresh.
  await page.reload();

  await expect(
    page.getByText("Cash Wallet → eSewa Test")
  ).toBeVisible();
});
