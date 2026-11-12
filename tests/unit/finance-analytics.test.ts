
import { describe, expect, it } from "vitest";


import type {
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";



import {
  calculateSavingsRate,
  getCategorySpending,
  getMonthKey,
  getMonthTransactions,
  getMonthlyTrend,
} from "../../lib/finance-analytics";


const transactions: FinanceTransaction[] = [
  {
    id: "income-nov",
    type: "income",
    accountId: "cash",
    categoryId: "salary",
    amountPaisa: 1000000,
    occurredOn: "2026-11-05",
  },
  {
    id: "food-nov",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 250000,
    occurredOn: "2026-11-06",
  },
  {
    id: "transport-nov",
    type: "expense",
    accountId: "bank",
    categoryId: "transport",
    amountPaisa: 50000,
    occurredOn: "2026-11-07",
  },
  {
    id: "transfer-nov",
    type: "transfer",
    fromAccountId: "cash",
    toAccountId: "bank",
    amountPaisa: 30000,
    occurredOn: "2026-11-08",
  },
  {
    id: "food-oct",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 100000,
    occurredOn: "2026-10-25",
  },
];

const categories: FinanceCategory[] = [
  { id: "food", name: "Food & Drinks", type: "expense" },
  {
    id: "transport",
    name: "Transportation",
    type: "expense",
  },
];

describe("Finance analytics", () => {
  it("generates the correct month key", () => {
    expect(getMonthKey(new Date(2026, 10, 12)))
      .toBe("2026-11");
  });

  it("filters records to the selected month", () => {
    const selected = getMonthTransactions(
      transactions,
      "2026-11"
    );

    expect(selected).toHaveLength(4);
  });

  it("calculates monthly income and expenses", () => {
    const trend = getMonthlyTrend(
      transactions,
      3,
      new Date(2026, 10, 12)
    );

    expect(trend.map((month) => month.monthKey))
      .toEqual(["2026-09", "2026-10", "2026-11"]);

    const november = trend[2];

    expect(november.incomePaisa).toBe(1000000);
    expect(november.expensePaisa).toBe(300000);
    expect(november.netPaisa).toBe(700000);
  });

  it("does not count transfers as income or expenses", () => {
    const november = getMonthlyTrend(
      transactions,
      1,
      new Date(2026, 10, 12)
    )[0];

    expect(november.incomePaisa).toBe(1000000);
    expect(november.expensePaisa).toBe(300000);
  });

  it("calculates category spending percentages", () => {
    const spending = getCategorySpending(
      transactions,
      categories,
      "2026-11"
    );

    expect(spending).toHaveLength(2);
    expect(spending[0].name).toBe("Food & Drinks");
    expect(spending[0].amountPaisa).toBe(250000);
    expect(spending[0].percentage)
      .toBeCloseTo(83.3333, 3);
  });

  it("uses renamed category names without losing records", () => {
    const renamed = categories.map((category) =>
      category.id === "food"
        ? { ...category, name: "Meals" }
        : category
    );

    const spending = getCategorySpending(
      transactions,
      renamed,
      "2026-11"
    );

    expect(spending[0].name).toBe("Meals");
    expect(spending[0].amountPaisa).toBe(250000);
  });

  it("calculates savings rate", () => {
    expect(calculateSavingsRate(1000000, 300000))
      .toBe(70);
  });

  it("does not invent a savings rate without income", () => {
    expect(calculateSavingsRate(0, 300000))
      .toBeNull();
  });
});
