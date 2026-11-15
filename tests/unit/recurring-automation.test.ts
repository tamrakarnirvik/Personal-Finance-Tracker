
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";

import type {
  RecurringSchedule,
} from "../../lib/recurring-planning";

import {
  buildDueTodayCandidates,
  isRecurringAutomationSettings,
  readRecurringAutomationSettings,
} from "../../lib/recurring-automation";

// ==========================================
// TEST DATA
// ==========================================

const accounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
];

const categories = [
  {
    id: "food",
    name: "Food",
    type: "expense",
  },
  {
    id: "salary",
    name: "Salary",
    type: "income",
  },
] as FinanceCategory[];

const base: RecurringSchedule = {
  id: "weekly-1",
  name: "Groceries",
  type: "expense",
  accountId: "cash",
  categoryId: "food",
  amountPaisa: 150000,
  startOn: "2026-11-01",
  frequency: "weekly",
  note: "",
  active: true,
};

// ==========================================
// TEST HELPER
// ==========================================

function candidates(
  schedules: RecurringSchedule[],
  today: string,
  transactions: FinanceTransaction[] = []
) {
  return buildDueTodayCandidates({
    schedules,
    today,
    transactions,
    accounts,
    categories,
  });
}

// ==========================================
// UNIT TESTS
// ==========================================

describe("recurring automation safety", () => {
  it(
    "starts with automatic posting disabled",
    () => {
      const result =
        readRecurringAutomationSettings(null);

      expect(result.error).toBeNull();

      expect(
        result.settings.autoPostDueToday
      ).toBe(false);

      expect(
        result.settings.showDashboardWidget
      ).toBe(true);

      expect(
        result.settings.reminderDaysAhead
      ).toBe(14);
    }
  );

  it(
    "accepts valid preferences and rejects invalid saved settings",
    () => {
      const valid = {
        autoPostDueToday: true,
        reminderDaysAhead: 30,
        showDashboardWidget: false,
      };

      expect(
        isRecurringAutomationSettings(valid)
      ).toBe(true);

      expect(
        readRecurringAutomationSettings(
          JSON.stringify(valid)
        ).settings
      ).toEqual(valid);

      expect(
        readRecurringAutomationSettings(
          "{broken-json"
        ).error
      ).toMatch(/invalid/i);

      expect(
        isRecurringAutomationSettings({
          ...valid,
          reminderDaysAhead: 365,
        })
      ).toBe(false);
    }
  );

  it(
    "only prepares the occurrence due today",
    () => {
      expect(
        candidates(
          [base],
          "2026-11-08"
        )
      ).toHaveLength(1);

      expect(
        candidates(
          [base],
          "2026-11-09"
        )
      ).toHaveLength(0);

      expect(
        candidates(
          [base],
          "2026-11-15"
        )[0].occurrence.id
      ).toBe(
        "recurring:weekly-1-wk-20261115:2026-11"
      );
    }
  );

  it(
    "excludes an already-posted occurrence",
    () => {
      const existing = candidates(
        [base],
        "2026-11-08"
      )[0];

      const transaction: FinanceTransaction = {
        ...existing.draft,
        id: existing.occurrence.id,
      };

      expect(
        candidates(
          [base],
          "2026-11-08",
          [transaction]
        )
      ).toHaveLength(0);
    }
  );

  it(
    "ignores paused schedules and broken references",
    () => {
      expect(
        candidates(
          [{
            ...base,
            active: false,
          }],
          "2026-11-08"
        )
      ).toHaveLength(0);

      expect(
        candidates(
          [{
            ...base,
            accountId: "missing",
          }],
          "2026-11-08"
        )
      ).toHaveLength(0);

      expect(
        candidates(
          [{
            ...base,
            categoryId: "salary",
          }],
          "2026-11-08"
        )
      ).toHaveLength(0);
    }
  );

  it(
    "supports legacy monthly and yearly due-today entries",
    () => {
      const oldMonthly: RecurringSchedule = {
        ...base,
        id: "monthly-1",
        startOn: "2026-09-15",
        frequency: undefined,
      };

      const yearly: RecurringSchedule = {
        ...base,
        id: "yearly-1",
        startOn: "2025-11-15",
        frequency: "yearly",
      };

      expect(
        candidates(
          [
            oldMonthly,
            yearly,
          ],
          "2026-11-15"
        )
      ).toHaveLength(2);
    }
  );

  it(
    "rejects an invalid current date",
    () => {
      expect(
        () =>
          candidates(
            [base],
            "2026-02-30"
          )
      ).toThrow(/date/i);
    }
  );
});
