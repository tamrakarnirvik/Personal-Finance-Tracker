
import type {
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

export interface MonthlyTrend {
  monthKey: string;
  label: string;
  incomePaisa: number;
  expensePaisa: number;
  netPaisa: number;
}

export interface CategorySpending {
  categoryId: string;
  name: string;
  amountPaisa: number;
  percentage: number;
}

// Return YYYY-MM using the local calendar.
export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

// Get transactions belonging to a selected month.
export function getMonthTransactions(
  transactions: FinanceTransaction[],
  monthKey: string
): FinanceTransaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.occurredOn.slice(0, 7) === monthKey
  );
}

// Generate real income and expense data for recent months.
export function getMonthlyTrend(
  transactions: FinanceTransaction[],
  months = 6,
  referenceDate = new Date()
): MonthlyTrend[] {
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new Error("Months must be between 1 and 24.");
  }

  const rows: MonthlyTrend[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - offset,
      1
    );

    rows.push({
      monthKey: getMonthKey(date),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
      }).format(date),
      incomePaisa: 0,
      expensePaisa: 0,
      netPaisa: 0,
    });
  }

  const byMonth = new Map(
    rows.map((row) => [row.monthKey, row])
  );

  for (const transaction of transactions) {
    const monthKey = transaction.occurredOn.slice(0, 7);
    const month = byMonth.get(monthKey);

    if (!month) continue;

    if (transaction.type === "income") {
      month.incomePaisa += transaction.amountPaisa;
    }

    if (transaction.type === "expense") {
      month.expensePaisa += transaction.amountPaisa;
    }

    // Transfers are intentionally excluded.
  }

  for (const month of rows) {
    month.netPaisa =
      month.incomePaisa - month.expensePaisa;
  }

  return rows;
}

// Calculate the distribution of monthly expenses.
export function getCategorySpending(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  monthKey: string
): CategorySpending[] {
  const categoryNames = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ])
  );

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

  const totalExpenses = Array.from(totals.values())
    .reduce((sum, amount) => sum + amount, 0);

  return Array.from(totals.entries())
    .map(([categoryId, amountPaisa]) => ({
      categoryId,
      name:
        categoryNames.get(categoryId) ??
        "Uncategorized",
      amountPaisa,
      percentage:
        totalExpenses > 0
          ? (amountPaisa / totalExpenses) * 100
          : 0,
    }))
    .sort(
      (a, b) =>
        b.amountPaisa - a.amountPaisa ||
        a.name.localeCompare(b.name)
    );
}

// Savings rate is undefined when there is no income.
export function calculateSavingsRate(
  incomePaisa: number,
  expensePaisa: number
): number | null {
  if (incomePaisa <= 0) return null;

  return (
    ((incomePaisa - expensePaisa) / incomePaisa) * 100
  );
}

// Compact labels for chart axes.
export function formatChartAmount(paisa: number): string {
  const rupees = paisa / 100;
  const absolute = Math.abs(rupees);

  if (absolute >= 100000) {
    return `${(rupees / 100000).toFixed(1)}L`;
  }

  if (absolute >= 1000) {
    return `${(rupees / 1000).toFixed(0)}k`;
  }

  return rupees.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}
