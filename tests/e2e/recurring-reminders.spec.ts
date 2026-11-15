
import {
  expect,
  test,
} from "@playwright/test";

test(
  "shows a missed reminder and posts it only once",
  async ({ page }) => {
    await page.goto("/recurring");

    // Calculate yesterday's local date.

    const yesterday = await page.evaluate(
      () => {
        const date = new Date();

        date.setDate(
          date.getDate() - 1
        );

        const month = String(
          date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          date.getDate()
        ).padStart(2, "0");

        return (
          `${date.getFullYear()}-${month}-${day}`
        );
      }
    );

    // ======================================
    // CREATE RECURRING SCHEDULE
    // ======================================

    const editor = page.getByRole(
      "region",
      {
        name:
          "Recurring schedule editor",
      }
    );

    await editor
      .getByLabel("Name", {
        exact: true,
      })
      .fill(
        "QA Reminder Bill"
      );

    await editor
      .getByLabel(
        "First due date"
      )
      .fill(yesterday);

    await editor
      .getByLabel("Account", {
        exact: true,
      })
      .selectOption({
        index: 1,
      });

    await editor
      .getByLabel("Category", {
        exact: true,
      })
      .selectOption({
        label:
          "Food & Drinks",
      });

    await editor
      .getByLabel("Amount (NPR)")
      .fill("780");

    await editor
      .getByRole("button", {
        name: "Save schedule",
      })
      .click();

    // ======================================
    // CHECK OVERDUE REMINDER
    // ======================================

    const panel = page.getByRole(
      "region",
      {
        name:
          "Recurring payment reminders",
      }
    );

    const overdue = panel
      .getByRole("article")
      .filter({
        hasText:
          "QA Reminder Bill",
      })
      .filter({
        hasText:
          "overdue",
      });

    await expect(
      overdue
    ).toBeVisible();

    // ======================================
    // POST TRANSACTION
    // ======================================

    page.once(
      "dialog",
      (dialog) =>
        dialog.accept()
    );

    await overdue
      .getByRole("button", {
        name: "Post now",
      })
      .click();

    await expect(
      overdue
    ).toHaveCount(0);

    // ======================================
    // FIND THE STABLE OCCURRENCE ID
    // ======================================

    const occurrenceId =
      await page.evaluate(
        (monthKey) => {
          const saved = JSON.parse(
            window.localStorage.getItem(
              "expense-tracker-recurring-v1"
            ) ?? "[]"
          ) as {
            id: string;
            name: string;
          }[];

          const schedule =
            saved.find(
              (item) =>
                item.name ===
                "QA Reminder Bill"
            );

          if (!schedule) {
            throw new Error(
              "Test schedule not found"
            );
          }

          return (
            `recurring:${schedule.id}:${monthKey}`
          );
        },
        yesterday.slice(0, 7)
      );

    // ======================================
    // VERIFY TRANSACTION SAVED ONCE
    // ======================================

    await expect
      .poll(async () =>
        page.evaluate(
          (id) => {
            const saved = JSON.parse(
              window.localStorage.getItem(
                "expense-tracker-transactions-v1"
              ) ?? "[]"
            ) as {
              id: string;
            }[];

            return saved.filter(
              (item) =>
                item.id === id
            ).length;
          },
          occurrenceId
        )
      )
      .toBe(1);

    // ======================================
    // RELOAD AND VERIFY NO DUPLICATE
    // ======================================

    await page.reload();

    await expect(
      page
        .getByRole("region", {
          name:
            "Recurring payment reminders",
        })
        .getByRole("article")
        .filter({
          hasText:
            "QA Reminder Bill",
        })
        .filter({
          hasText:
            "overdue",
        })
    ).toHaveCount(0);
  }
);
