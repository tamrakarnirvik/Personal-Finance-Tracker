
import {
  expect,
  test,
} from "@playwright/test";

const settingsKey =
  "expense-tracker-recurring-automation-v1";

const schedulesKey =
  "expense-tracker-recurring-v1";

const transactionsKey =
  "expense-tracker-transactions-v1";

// ==========================================
// SEED A DUE-TODAY SCHEDULE
// ==========================================

async function seedDueToday(
  page: import("@playwright/test").Page,
  enabled: boolean
) {
  await page.addInitScript(
    ({ settingsKey, schedulesKey, enabled }) => {
      const now = new Date();

      const yyyy = now.getFullYear();

      const mm = String(
        now.getMonth() + 1
      ).padStart(2, "0");

      const dd = String(
        now.getDate()
      ).padStart(2, "0");

      const today = `${yyyy}-${mm}-${dd}`;

      localStorage.setItem(
        schedulesKey,
        JSON.stringify([
          {
            id: "qa-autopost-1",
            name: "QA Due Today",
            type: "expense",
            accountId: "cash",
            categoryId: "food",
            amountPaisa: 27500,
            startOn: today,
            frequency: "monthly",
            note: "QA test",
            active: true,
          },
        ])
      );

      localStorage.setItem(
        settingsKey,
        JSON.stringify({
          autoPostDueToday: enabled,
          showDashboardWidget: true,
          reminderDaysAhead: 14,
        })
      );
    },
    {
      settingsKey,
      schedulesKey,
      enabled,
    }
  );
}

// ==========================================
// COUNT POSTED RECURRING ENTRIES
// ==========================================

async function recordedCount(
  page: import("@playwright/test").Page
): Promise<number> {
  return page.evaluate((key) => {
    const items = JSON.parse(
      localStorage.getItem(key) ?? "[]"
    ) as {
      id: string;
    }[];

    return items.filter(
      (item) =>
        item.id.startsWith(
          "recurring:qa-autopost-1:"
        )
    ).length;
  }, transactionsKey);
}

// ==========================================
// TEST 1 — DEFAULT MANUAL POSTING
// ==========================================

test(
  "manual posting stays the default",
  async ({ page }) => {
    await seedDueToday(page, false);

    await page.goto("/dashboard");

    await expect(
      page.getByRole("region", {
        name: "Recurring summary",
      })
    ).toBeVisible();

    expect(
      await recordedCount(page)
    ).toBe(0);
  }
);

// ==========================================
// TEST 2 — AUTOMATIC POSTING
// ==========================================

test(
  "opt-in auto-posts today's entry once across reloads",
  async ({ page }) => {
    await seedDueToday(page, true);

    await page.goto("/dashboard");

    await expect
      .poll(
        () => recordedCount(page)
      )
      .toBe(1);

    // Reload the workspace.
    await page.reload();

    // The same occurrence must not
    // create another transaction.
    await expect
      .poll(
        () => recordedCount(page)
      )
      .toBe(1);
  }
);

// ==========================================
// TEST 3 — SAVE AUTOMATION PREFERENCES
// ==========================================

test(
  "recurring preferences persist after refresh",
  async ({ page }) => {
    await page.goto("/recurring");

    const panel = page.getByRole(
      "region",
      {
        name:
          "Recurring automation preferences",
      }
    );

    // Select the 30-day reminder window.

    await panel
      .getByLabel(
        "Upcoming reminder window"
      )
      .selectOption("30");

    // Disable Dashboard reminders.

    await panel
      .getByLabel(
        "Show reminders on Dashboard"
      )
      .uncheck();

    // Refresh and verify persistence.

    await page.reload();

    await expect(
      panel.getByLabel(
        "Upcoming reminder window"
      )
    ).toHaveValue("30");

    await expect(
      panel.getByLabel(
        "Show reminders on Dashboard"
      )
    ).not.toBeChecked();

    // Dashboard widget should be hidden.

    await page.goto("/dashboard");

    await expect(
      page.getByRole("region", {
        name: "Recurring summary",
      })
    ).toHaveCount(0);
  }
);
