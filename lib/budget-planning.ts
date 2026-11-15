
import type { FinanceTransaction } from "@/types/finance";

export const BUDGET_STORAGE_KEY = "expense-tracker-budgets-v1";

export interface MonthlyBudget {
  id: string;
  monthKey: string;
  categoryId: string;
  limitPaisa: number;
}

export function isMonthlyBudget(
  value: unknown
): value is MonthlyBudget {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.categoryId === "string" &&
    record.categoryId.length > 0 &&
    typeof record.monthKey === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(record.monthKey) &&
    typeof record.limitPaisa === "number" &&
    Number.isSafeInteger(record.limitPaisa) &&
    record.limitPaisa > 0
  );
}

// Only expense transactions consume category budgets.
export function getExpenseByCategory(
  transactions: FinanceTransaction[],
  monthKey: string
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (
      transaction.type !== "expense" ||
      !transaction.occurredOn.startsWith(monthKey)
    ) {
      continue;
    }

    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) +
        transaction.amountPaisa
    );
  }

  return totals;
}

export function getBudgetProgress(
  limitPaisa: number,
  spentPaisa: number
) {
  const remainingPaisa = limitPaisa - spentPaisa;

  const percentage =
    limitPaisa > 0
      ? (spentPaisa / limitPaisa) * 100
      : 0;

  return {
    remainingPaisa,
    percentage,
    isOverBudget: remainingPaisa < 0,
  };
}

export function summarizeMonthlyBudgets(
  budgets: MonthlyBudget[],
  transactions: FinanceTransaction[],
  monthKey: string
) {
  const activeBudgets = budgets.filter(
    (budget) => budget.monthKey === monthKey
  );

  const spentByCategory = getExpenseByCategory(
    transactions,
    monthKey
  );

  const budgetedCategoryIds = new Set(
    activeBudgets.map((budget) => budget.categoryId)
  );

  const allocatedPaisa = activeBudgets.reduce(
    (total, budget) => total + budget.limitPaisa,
    0
  );

  const budgetedSpentPaisa = [
    ...budgetedCategoryIds,
  ].reduce(
    (total, categoryId) =>
      total + (spentByCategory.get(categoryId) ?? 0),
    0
  );

  const unbudgetedSpentPaisa = [
    ...spentByCategory,
  ].reduce(
    (total, [categoryId, value]) =>
      total +
      (budgetedCategoryIds.has(categoryId) ? 0 : value),
    0
  );

  return {
    activeBudgets,
    spentByCategory,
    allocatedPaisa,
    budgetedSpentPaisa,
    unbudgetedSpentPaisa,
    remainingPaisa:
      allocatedPaisa - budgetedSpentPaisa,
  };
}
