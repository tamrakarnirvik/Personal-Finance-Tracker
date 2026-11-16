
import {
  test,
  expect,
} from "@playwright/test";

// ==========================================
// WORKSPACE PAGE ROUTES
// ==========================================

const pages = [
  {
    path: "/dashboard",
    title: "Dashboard",
  },
  {
    path: "/transactions",
    title: "Transactions",
  },
  {
    path: "/accounts",
    title: "Accounts",
  },
  {
    path: "/budgets",
    title: "Budgets",
  },
  {
    path: "/analytics",
    title: "Analytics",
  },
  {
    path: "/settings",
    title: "Settings",
  },
];

// ==========================================
// PAGE LOAD TESTS
// ==========================================

for (const item of pages) {
  test(
    `${item.title} page loads`,
    async ({ page }) => {
      await page.goto(item.path);

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: item.title,
          exact: true,
        })
      ).toBeVisible();
    }
  );
}

// ==========================================
// HOMEPAGE REDIRECT
// ==========================================

test(
  "homepage redirects to dashboard",
  async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(
      /\/dashboard$/
    );
  }
);

// ==========================================
// DESKTOP SIDEBAR NAVIGATION
// ==========================================

test(
  "desktop sidebar navigation works",
  async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      "Desktop navigation test"
    );

    await page.goto("/dashboard");

    const nav = page.getByRole(
      "navigation",
      {
        name: "Main navigation",
      }
    );

    await nav
      .getByRole("link", {
        name: "Transactions",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(
      /\/transactions$/
    );
  }
);

// ==========================================
// MOBILE MORE NAVIGATION
// ==========================================

test(
  "mobile More menu opens Analytics",
  async ({ page, isMobile }) => {
    test.skip(
      !isMobile,
      "Mobile navigation test"
    );

    await page.goto("/dashboard");

    const nav = page.getByRole(
      "navigation",
      {
        name: "Mobile navigation",
      }
    );

    await nav
      .getByRole("button", {
        name: "More",
        exact: true,
      })
      .click();

    await nav
      .getByRole("link", {
        name: "Analytics",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(
      /\/analytics$/
    );
  }
);

// ==========================================
// DARK MODE PERSISTENCE TEST
// ==========================================

test(
  "dark mode is saved after refresh",
  async ({ page }) => {
    // STEP 1:
    // Open the application.

    await page.goto("/dashboard");

    // STEP 2:
    // Set a known starting theme.

    await page.evaluate(() => {
      window.localStorage.setItem(
        "theme",
        "light"
      );
    });

    // STEP 3:
    // Reload so next-themes reads
    // the saved light preference.

    await page.reload();

    // STEP 4:
    // Wait for light mode to be
    // applied to the HTML element.

    await expect(
      page.locator("html")
    ).toHaveClass(
      /\blight\b/,
      { timeout: 10000 }
    );

    // STEP 5:
    // Ensure the toggle is usable.

    const toggle = page.getByRole(
      "button",
      {
        name:
          "Toggle light and dark theme",
        exact: true,
      }
    );

    await expect(
      toggle
    ).toBeEnabled();

    // STEP 6:
    // Switch from light to dark.

    await toggle.click();

    // STEP 7:
    // Verify the HTML theme class.

    await expect(
      page.locator("html")
    ).toHaveClass(
      /\bdark\b/,
      { timeout: 10000 }
    );

    // STEP 8:
    // Verify localStorage persistence.

    await expect
      .poll(() =>
        page.evaluate(() => {
          return window.localStorage.getItem(
            "theme"
          );
        })
      )
      .toBe("dark");

    // STEP 9:
    // Reload the application again.

    await page.reload();

    // STEP 10:
    // Dark mode must remain active.

    await expect(
      page.locator("html")
    ).toHaveClass(
      /\bdark\b/,
      { timeout: 10000 }
    );

    // STEP 11:
    // Verify stored preference remains.

    const storedTheme =
      await page.evaluate(() => {
        return window.localStorage.getItem(
          "theme"
        );
      });

    expect(storedTheme).toBe("dark");

    // STEP 12:
    // Switch back to light mode.

    await page
      .getByRole("button", {
        name:
          "Toggle light and dark theme",
        exact: true,
      })
      .click();

    await expect(
      page.locator("html")
    ).toHaveClass(
      /\blight\b/,
      { timeout: 10000 }
    );

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem(
            "theme"
          )
        )
      )
      .toBe("light");
  }
);
