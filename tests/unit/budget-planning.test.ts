
import { describe, expect, it } from "vitest";

import type {
  FinanceTransaction,
} from "../../types/finance";

import {
  getBudgetProgress,
  getExpenseByCategory,
  isMonthlyBudget,
  summarizeMonthlyBudgets,
  type MonthlyBudget,
} from "../../lib/budget-planning";

const transactions = [
  {
    id: "exp1",
    type: "expense",
    categoryId: "food",
    amountPaisa: 120000,
    occurredOn: "2026-11-02",
  },
  {
    id: "exp2",
    type: "expense",
    categoryId: "travel",
    amountPaisa: 30000,
    occurredOn: "2026-11-04",
  },
  {
    id: "exp3",
    type: "expense",
    categoryId: "food",
    amountPaisa: 40000,
    occurredOn: "2026-10-30",
  },
  {
    id: "inc",
    type: "income",
    categoryId: "salary",
    amountPaisa: 500000,
    occurredOn: "2026-11-01",
  },
  {
    id: "trf",
    type: "transfer",
    amountPaisa: 900000,
    occurredOn: "2026-11-01",
  },
] as FinanceTransaction[];

const budgets: MonthlyBudget[] = [
  {
    id: "b1",
    monthKey: "2026-11",
    categoryId: "food",
    limitPaisa: 100000,
  },
  {
    id: "b2",
    monthKey: "2026-10",
    categoryId: "food",
    limitPaisa: 200000,
  },
];

describe("monthly category budgets", () => {
  it("counts only expenses in the selected month", () => {
    const spent = getExpenseByCategory(
      transactions,
      "2026-11"
    );

    expect(spent.get("food")).toBe(120000);
    expect(spent.get("travel")).toBe(30000);
    expect(spent.has("salary")).toBe(false);
  });

  it("calculates over-budget state", () => {
    expect(
      getBudgetProgress(100000, 120000)
    ).toMatchObject({
      remainingPaisa: -20000,
      percentage: 120,
      isOverBudget: true,
    });
  });

  it("separates budgeted and unbudgeted spending", () => {
    const summary = summarizeMonthlyBudgets(
      budgets,
      transactions,
      "2026-11"
    );

    expect(summary.allocatedPaisa).toBe(100000);
    expect(summary.budgetedSpentPaisa).toBe(120000);
    expect(summary.unbudgetedSpentPaisa).toBe(30000);
    expect(summary.remainingPaisa).toBe(-20000);
  });

  it("validates stored budget records", () => {
    expect(isMonthlyBudget(budgets[0])).toBe(true);

    expect(
      isMonthlyBudget({
        ...budgets[0],
        limitPaisa: -1,
      })
    ).toBe(false);

    expect(
      isMonthlyBudget({
        ...budgets[0],
        monthKey: "2026-13",
      })
    ).toBe(false);
  });
});
