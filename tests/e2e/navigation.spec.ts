
import { test, expect } from "@playwright/test";

const pages = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/transactions", title: "Transactions" },
  { path: "/accounts", title: "Accounts" },
  { path: "/budgets", title: "Budgets" },
  { path: "/analytics", title: "Analytics" },
  { path: "/settings", title: "Settings" },
];

// Check all six pages.
for (const item of pages) {
  test(`${item.title} page loads`, async ({ page }) => {
    await page.goto(item.path);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: item.title,
        exact: true,
      })
    ).toBeVisible();
  });
}

test("homepage redirects to dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("desktop sidebar navigation works", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop navigation test");

  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", {
    name: "Main navigation",
  });

  await nav.getByRole("link", {
    name: "Transactions",
  }).click();

  await expect(page).toHaveURL(/\/transactions$/);
});

test("mobile More menu opens Analytics", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile navigation test");

  await page.goto("/dashboard");

  await page
    .getByRole("navigation", {
      name: "Mobile navigation",
    })
    .getByRole("button", { name: "More" })
    .click();

  
await page
  .getByRole("navigation", {
    name: "Mobile navigation",
  })
  .getByRole("link", {
    name: "Analytics",
    exact: true,
  })
  .click();


  await expect(page).toHaveURL(/\/analytics$/);
});


test("dark mode is saved after refresh", async ({ page }) => {
  // Open the dashboard.
  await page.goto("/dashboard");

  // Set the initial theme to light only once.
  await page.evaluate(() => {
    localStorage.setItem("theme", "light");
  });

  // Reload to apply the initial theme.
  await page.reload();

  await expect(page.locator("html")).toHaveClass(/\blight\b/);

  // Click the theme toggle.
  await page.getByRole("button", {
    name: "Toggle light and dark theme",
  }).click();

  // Verify dark mode activates.
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);

  // Verify the selection was saved.
  await expect.poll(async () => {
    return page.evaluate(() => localStorage.getItem("theme"));
  }).toBe("dark");

  // Reload and verify the saved theme persists.
  await page.reload();

  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});

