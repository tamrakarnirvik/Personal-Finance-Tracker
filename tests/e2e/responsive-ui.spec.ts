import { expect, test } from "@playwright/test";

const routes = [
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/transactions", heading: "Transactions" },
  { path: "/accounts", heading: "Accounts" },
  { path: "/budgets", heading: "Budgets" },
  { path: "/analytics", heading: "Analytics" },
  { path: "/settings", heading: "Settings" },
] as const;

const viewports = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test(`all workspace pages fit the ${viewport.name} viewport`, async ({
    page,
  }) => {
    // Set the viewport BEFORE navigating, as recommended by Playwright.
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    for (const route of routes) {
      await test.step(`${route.path} at ${viewport.width}px`, async () => {
        await page.goto(route.path);

        await expect(
          page.getByRole("heading", {
            name: route.heading,
            level: 1,
          })
        ).toBeVisible();

        await expect(page.locator("#main-content")).toBeVisible();

        // Catch accidental page-wide horizontal scrolling. A small
        // tolerance accommodates fractional pixel rounding.
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const root = document.documentElement;
                return root.scrollWidth - root.clientWidth;
              }),
            {
              message: `${route.path} should not scroll horizontally at ${viewport.width}px`,
            }
          )
          .toBeLessThanOrEqual(2);

        const navLabel =
          viewport.width >= 1024 ? "Main navigation" : "Mobile navigation";

        await expect(
          page.getByRole("navigation", { name: navLabel })
        ).toBeVisible();
      });
    }
  });
}
