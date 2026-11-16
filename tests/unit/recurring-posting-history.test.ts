
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  FinanceTransaction,
} from "../../types/finance";

import type {
  RecurringSchedule,
} from "../../lib/recurring-planning";

import {
  buildRecurringPostingHistory,
  createRecurringHistoryCsv,
} from "../../lib/recurring-posting-history";

// ==========================================
// TEST SCHEDULE
// ==========================================

const schedules: RecurringSchedule[] = [
  {
    id: "food-1",
    name: "Groceries",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 50000,
    startOn: "2026-11-01",
    frequency: "weekly",
    note: "",
    active: true,
  },
];

// ==========================================
// TEST TRANSACTIONS
// ==========================================

const transactions:
  FinanceTransaction[] = [
    {
      id:
        "recurring:food-1-wk-20261108:2026-11",
      type: "expense",
      accountId: "cash",
      categoryId: "food",
      occurredOn: "2026-11-08",
      amountPaisa: 50000,
      note: "Weekly groceries",
    },
    {
      id:
        "recurring:deleted-1:2026-10",
      type: "income",
      accountId: "bank",
      categoryId: "salary",
      occurredOn: "2026-10-10",
      amountPaisa: 120000,
      note: "Freelance",
    },
    {
      id: "manual-1",
      type: "expense",
      accountId: "cash",
      categoryId: "food",
      occurredOn: "2026-11-09",
      amountPaisa: 20000,
      note: "Manual",
    },
  ];

// ==========================================
// TESTS
// ==========================================

describe("recurring posting history", () => {
  it(
    "shows actual posted recurring entries only",
    () => {
      const rows =
        buildRecurringPostingHistory(
          transactions,
          schedules
        );

      expect(
        rows
      ).toHaveLength(2);

      expect(
        rows[0].scheduleName
      ).toBe("Groceries");

      expect(
        rows[0].frequency
      ).toBe("weekly");

      expect(
        rows[0].scheduleId
      ).toBe("food-1");

      expect(
        rows[1].scheduleName
      ).toBe("Freelance");
    }
  );

  it(
    "protects CSV from spreadsheet formulas",
    () => {
      const rows =
        buildRecurringPostingHistory(
          transactions,
          schedules
        );

      const csv =
        createRecurringHistoryCsv(
          [
            {
              ...rows[0],
              note:
                "=HYPERLINK(1)",
            },
          ],
          () => "Cash",
          () => "Food"
        );

      expect(csv).toContain(
        "'=HYPERLINK(1)"
      );

      expect(csv).toContain(
        "500.00"
      );
    }
  );

  it(
    "rejects malformed recurring IDs from history",
    () => {
      const bad = {
        ...transactions[0],

        id:
          "recurring:food-1-wk-20261108:2026-10",
      };

      expect(
        buildRecurringPostingHistory(
          [bad],
          schedules
        )
      ).toHaveLength(0);
    }
  );
});
