
import { test, expect } from "@playwright/test";

test("create an expense and show it on the dashboard", async ({
  page,
  isMobile,
}) => {
  await page.goto("/transactions");

  await page
    .getByRole("button", { name: "Add Transaction" })
    .click();

  await page.getByLabel("Amount (NPR)").fill("250.50");

  await page.getByLabel("Date").fill("2026-11-06");

  await page
    .getByLabel("Description (optional)")
    .fill("Test Lunch");

  await page
    .getByRole("button", { name: "Save Transaction" })
    .click();

  await expect(page.getByText("Test Lunch")).toBeVisible();

  const navName = isMobile
    ? "Mobile navigation"
    : "Main navigation";

  await page
    .getByRole("navigation", { name: navName })
    .getByRole("link", { name: "Dashboard" })
    .click();

  await expect(page.getByText("Test Lunch")).toBeVisible();
});
