
import { expect, test } from "@playwright/test";

// ==========================================
// PHASE 14 AND 15 ROUTE SMOKE TEST
// ==========================================

test(
  "advanced insights and data health pages open on desktop and mobile",
  async ({ page }) => {
    // Advanced Insights

    await page.goto("/insights");

    await expect(
      page.getByRole("heading", {
        name: "Advanced Insights",
        exact: true,
        level: 1,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("region", {
        name: "Advanced financial insights summary",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("region", {
        name: "Twelve month cash flow chart",
      })
    ).toBeVisible();

    // Data Health

    await page.goto("/data-health");

    // Exact h1 prevents matching
    // the "Local data health" h2.

    await expect(
      page.getByRole("heading", {
        name: "Data Health",
        exact: true,
        level: 1,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Check backup readiness",
        exact: true,
      })
    ).toBeVisible();
  }
);

// ==========================================
// EXISTING FEATURES REGRESSION TEST
// ==========================================

test(
  "existing dashboard, goals and reports routes remain accessible",
  async ({ page }) => {
    // Dashboard

    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", {
        name: "Dashboard",
        exact: true,
        level: 1,
      })
    ).toBeVisible();

    // Savings Goals

    await page.goto("/goals");

    await expect(
      page.getByRole("heading", {
        name: "Savings Goals",
        exact: true,
        level: 1,
      })
    ).toBeVisible();

    // Financial Reports

    await page.goto("/reports");

    await expect(
      page.getByRole("heading", {
        name: "Financial Reports",
        exact: true,
        level: 1,
      })
    ).toBeVisible();
  }
);
