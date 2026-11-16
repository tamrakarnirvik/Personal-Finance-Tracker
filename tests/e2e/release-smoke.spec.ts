
import {
  expect,
  test,
} from "@playwright/test";

// ==========================================
// NEW FEATURES
// ==========================================

test(
  "advanced insights and data health pages open on desktop and mobile",
  async ({ page }) => {
    await page.goto("/insights");

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Advanced Insights",
        }
      )
    ).toBeVisible();

    await expect(
      page.getByRole(
        "region",
        {
          name:
            "Advanced financial insights summary",
        }
      )
    ).toBeVisible();

    await expect(
      page.getByRole(
        "region",
        {
          name:
            "Twelve month cash flow chart",
        }
      )
    ).toBeVisible();

    await page.goto("/data-health");

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Data Health",
        }
      )
    ).toBeVisible();

    await expect(
      page.getByRole(
        "button",
        {
          name:
            "Check backup readiness",
        }
      )
    ).toBeVisible();
  }
);

// ==========================================
// PREVIOUS FEATURES
// ==========================================

test(
  "existing dashboard, goals and reports routes remain accessible",
  async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole(
        "heading",
        {
          name: "Dashboard",
        }
      )
    ).toBeVisible();

    await page.goto("/goals");

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Savings Goals",
        }
      )
    ).toBeVisible();

    await page.goto("/reports");

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Financial Reports",
        }
      )
    ).toBeVisible();
  }
);
