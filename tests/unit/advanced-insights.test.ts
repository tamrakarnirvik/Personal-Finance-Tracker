
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

import {
  buildAdvancedInsights,
  percentChange,
  shiftInsightMonth,
} from "../../lib/advanced-insights";

// ==========================================
// TEST RECORDS
// ==========================================

const accounts = [
  {
    id: "cash",
    name: "Cash",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },

  {
    id: "bank",
    name: "Bank",
    type: "bank",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
] as FinanceAccount[];

const categories = [
  {
    id: "salary",
    name: "Salary",
    type: "income",
  },

  {
    id: "food",
    name: "Food",
    type: "expense",
  },
] as FinanceCategory[];

const transactions = [
  {
    id: "income-1",
    type: "income",
    occurredOn: "2026-08-01",
    accountId: "bank",
    categoryId: "salary",
    amountPaisa: 600000,
    note: "Salary",
  },

  {
    id: "expense-1",
    type: "expense",
    occurredOn: "2026-08-03",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 100000,
    note: "Groceries",
  },

  {
    id: "expense-2",
    type: "expense",
    occurredOn: "2026-09-03",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 120000,
    note: "Groceries",
  },

  {
    id: "expense-3",
    type: "expense",
    occurredOn: "2026-10-03",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 140000,
    note: "Groceries",
  },

  {
    id: "transfer",
    type: "transfer",
    occurredOn: "2026-10-04",
    fromAccountId: "bank",
    toAccountId: "cash",
    amountPaisa: 300000,
    note: "Transfer",
  },

  {
    id: "partial",
    type: "expense",
    occurredOn: "2026-11-01",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 999999,
    note: "Current partial month",
  },
] as FinanceTransaction[];

function run(
  rows = transactions
) {
  return buildAdvancedInsights({
    accounts,
    categories,
    transactions: rows,
    today: "2026-11-16",
  });
}

// ==========================================
// UNIT TESTS
// ==========================================

describe(
  "Phase 14 advanced insights",
  () => {
    it(
      "uses 12 completed months and excludes the partial month",
      () => {
        const result = run();

        expect(
          result.fromMonth
        ).toBe("2025-11");

        expect(
          result.throughMonth
        ).toBe("2026-10");

        expect(
          result.months
        ).toHaveLength(12);

        expect(
          result.expensePaisa
        ).toBe(360000);

        expect(
          result.incomePaisa
        ).toBe(600000);

        expect(
          result.netPaisa
        ).toBe(240000);
      }
    );

    it(
      "excludes transfers from spending",
      () => {
        const result = run();

        expect(
          result.expensePaisa
        ).toBe(360000);

        expect(
          result.topExpenseCategories[0].category
        ).toBe("Food");

        expect(
          result.topExpenseCategories[0].amountPaisa
        ).toBe(360000);
      }
    );

    it(
      "calculates a three-month moving-average estimate",
      () => {
        const result = run();

        expect(
          result.projection.map(
            (point) => point.month
          )
        ).toEqual([
          "2026-11",
          "2026-12",
          "2027-01",
        ]);

        expect(
          result.projection[0].estimatedExpensePaisa
        ).toBe(120000);

        expect(
          result.monthOverMonthExpenseChangePercent
        ).toBeCloseTo(
          16.6666667
        );
      }
    );

    it(
      "omits projections with insufficient history",
      () => {
        const result = run(
          transactions.filter(
            (item) =>
              item.id !== "expense-2"
          )
        );

        expect(
          result.projection
        ).toHaveLength(0);

        expect(
          result.projectionExplanation
        ).toMatch(
          /no projection/i
        );
      }
    );

    it(
      "handles year boundaries and unavailable comparisons",
      () => {
        expect(
          shiftInsightMonth(
            "2026-01",
            -1
          )
        ).toBe("2025-12");

        expect(
          shiftInsightMonth(
            "2026-11",
            3
          )
        ).toBe("2027-02");

        expect(
          percentChange(100, 0)
        ).toBeNull();

        expect(
          percentChange(130, 100)
        ).toBe(30);
      }
    );
  }
);
