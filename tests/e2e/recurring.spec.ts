
import {
  expect,
  test,
} from "@playwright/test";

test(
  "creates and posts one recurring expense for the month",
  async ({ page }) => {
    // ======================================
    // OPEN RECURRING PAGE
    // ======================================

    await page.goto("/recurring");

    // Generate today's local browser date.
    const today = await page.evaluate(() => {
      const date = new Date();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      return (
        `${date.getFullYear()}-${month}-${day}`
      );
    });

    // ======================================
    // CREATE A SCHEDULE
    // ======================================

    await page
      .getByLabel("Name", {
        exact: true,
      })
      .fill(
        "QA Internet subscription"
      );

    await page
      .getByLabel(
        "First due date"
      )
      .fill(today);

    await page
      .getByLabel("Account", {
        exact: true,
      })
      .selectOption({
        index: 1,
      });

    await page
      .getByLabel("Category", {
        exact: true,
      })
      .selectOption({
        label: "Food & Drinks",
      });

    await page
      .getByLabel("Amount (NPR)")
      .fill("1250");

    await page
      .getByRole("button", {
        name: "Save schedule",
      })
      .click();

    // ======================================
    // VERIFY MONTHLY OCCURRENCE
    // ======================================

    const panel = page.getByRole(
      "region",
      {
        name:
          "Monthly recurring occurrences",
      }
    );

    const entry = panel
      .getByRole("article")
      .filter({
        hasText:
          "QA Internet subscription",
      });

    await expect(
      entry
    ).toBeVisible();

    // ======================================
    // POST ONCE
    // ======================================

    await entry
      .getByRole("button", {
        name: "Post entry",
      })
      .click();

    await expect(
      entry.getByRole("button", {
        name: "Already posted",
      })
    ).toBeDisabled();

    // ======================================
    // RELOAD AND CHECK PERSISTENCE
    // ======================================

    await page.reload();

    const afterReload = page
      .getByRole("region", {
        name:
          "Monthly recurring occurrences",
      })
      .getByRole("article")
      .filter({
        hasText:
          "QA Internet subscription",
      });

    await expect(
      afterReload.getByRole(
        "button",
        {
          name: "Already posted",
        }
      )
    ).toBeDisabled();
  }
);
