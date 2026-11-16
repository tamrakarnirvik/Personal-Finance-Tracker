
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import {
  buildFinancialReport,
  isReportDate,
  type ReportCategoryRow,
} from "@/lib/finance-reporting";

export interface InsightMonth {
  month: string;
  incomePaisa: number;
  expensePaisa: number;
  netPaisa: number;
  transactionCount: number;
}

export interface ExpenseProjection {
  month: string;
  estimatedExpensePaisa: number;
}

export interface AdvancedInsights {
  fromMonth: string;
  throughMonth: string;

  months: InsightMonth[];

  incomePaisa: number;
  expensePaisa: number;
  netPaisa: number;

  averageMonthlyExpensePaisa: number;
  netToIncomePercent: number | null;

  lastMonthExpensePaisa: number;
  previousMonthExpensePaisa: number;
  yearAgoMonthExpensePaisa: number;

  monthOverMonthExpenseChangePercent:
    number | null;

  yearOverYearExpenseChangePercent:
    number | null;

  topExpenseCategories:
    ReportCategoryRow[];

  projection: ExpenseProjection[];
  projectionExplanation: string;
}

// ==========================================
// MONTH CALCULATIONS
// ==========================================

export function shiftInsightMonth(
  monthKey: string,
  offset: number
): string {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      monthKey
    ) ||
    !Number.isInteger(offset)
  ) {
    throw new Error(
      "Invalid month or month offset."
    );
  }

  const year = Number(
    monthKey.slice(0, 4)
  );

  const month = Number(
    monthKey.slice(5, 7)
  );

  const date = new Date(
    Date.UTC(
      year,
      month - 1 + offset,
      1
    )
  );

  return (
    `${date.getUTCFullYear()}-` +
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")
  );
}

function monthEnd(
  monthKey: string
): string {
  const [year, month] =
    monthKey.split("-").map(Number);

  const day = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return (
    `${monthKey}-` +
    String(day).padStart(2, "0")
  );
}

// ==========================================
// PERCENTAGE CHANGE
// ==========================================

export function percentChange(
  current: number,
  previous: number
): number | null {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }

  return (
    (current - previous) /
    Math.abs(previous)
  ) * 100;
}

// ==========================================
// BUILD ADVANCED INSIGHTS
// ==========================================

export function buildAdvancedInsights(args: {
  transactions: readonly FinanceTransaction[];
  accounts: readonly FinanceAccount[];
  categories: readonly FinanceCategory[];
  today: string;
}): AdvancedInsights {
  const {
    today,
    transactions,
    accounts,
    categories,
  } = args;

  if (!isReportDate(today)) {
    throw new Error(
      "A valid current date is required."
    );
  }

  const currentMonth =
    today.slice(0, 7);

  const latestClosed =
    shiftInsightMonth(
      currentMonth,
      -1
    );

  const comparisonMonth =
    shiftInsightMonth(
      latestClosed,
      -12
    );

  const firstDisplay =
    shiftInsightMonth(
      latestClosed,
      -11
    );

  // Load 13 completed months so we can
  // compare the latest closed month with
  // the same month in the previous year.

  const report = buildFinancialReport({
    transactions,
    accounts,
    categories,

    filters: {
      fromDate:
        `${comparisonMonth}-01`,

      toDate:
        monthEnd(latestClosed),

      accountId: "",
      categoryId: "",
      type: "all",
    },
  });

  const byMonth = new Map(
    report.monthly.map(
      (row) => [
        row.month,
        row,
      ]
    )
  );

  function getMonth(
    month: string
  ): InsightMonth {
    const item =
      byMonth.get(month);

    return {
      month,

      incomePaisa:
        item?.incomePaisa ?? 0,

      expensePaisa:
        item?.expensePaisa ?? 0,

      netPaisa:
        item?.netPaisa ?? 0,

      transactionCount:
        item?.transactionCount ?? 0,
    };
  }

  // ========================================
  // LAST 12 COMPLETED MONTHS
  // ========================================

  const months = Array.from(
    {
      length: 12,
    },
    (_, index) =>
      getMonth(
        shiftInsightMonth(
          firstDisplay,
          index
        )
      )
  );

  function sum(
    field:
      | "incomePaisa"
      | "expensePaisa"
  ) {
    return months.reduce(
      (total, item) => {
        const next =
          total + item[field];

        if (
          !Number.isSafeInteger(next)
        ) {
          throw new Error(
            "Amount exceeds the safe integer range."
          );
        }

        return next;
      },
      0
    );
  }

  const incomePaisa =
    sum("incomePaisa");

  const expensePaisa =
    sum("expensePaisa");

  const netPaisa =
    incomePaisa - expensePaisa;

  const last = months[11];
  const previous = months[10];

  const yearAgo =
    getMonth(comparisonMonth);

  // ========================================
  // CATEGORY RANKING
  // ========================================

  const categoryReport =
    buildFinancialReport({
      transactions,
      accounts,
      categories,

      filters: {
        fromDate:
          `${firstDisplay}-01`,

        toDate:
          monthEnd(latestClosed),

        accountId: "",
        categoryId: "",
        type: "expense",
      },
    });

  // ========================================
  // EXPENSE PROJECTION
  // ========================================

  const lastThree =
    months.slice(-3);

  const hasHistory =
    lastThree.every(
      (month) =>
        month.expensePaisa > 0
    );

  const average = hasHistory
    ? Math.round(
        lastThree.reduce(
          (total, month) =>
            total +
            month.expensePaisa,
          0
        ) / 3
      )
    : null;

  const projection:
    ExpenseProjection[] =
      average === null
        ? []
        : [1, 2, 3].map(
            (offset) => ({
              month:
                shiftInsightMonth(
                  latestClosed,
                  offset
                ),

              estimatedExpensePaisa:
                average,
            })
          );

  return {
    fromMonth: firstDisplay,
    throughMonth: latestClosed,
    months,

    incomePaisa,
    expensePaisa,
    netPaisa,

    averageMonthlyExpensePaisa:
      Math.round(
        expensePaisa / 12
      ),

    netToIncomePercent:
      incomePaisa > 0
        ? (
            netPaisa /
            incomePaisa
          ) * 100
        : null,

    lastMonthExpensePaisa:
      last.expensePaisa,

    previousMonthExpensePaisa:
      previous.expensePaisa,

    yearAgoMonthExpensePaisa:
      yearAgo.expensePaisa,

    monthOverMonthExpenseChangePercent:
      percentChange(
        last.expensePaisa,
        previous.expensePaisa
      ),

    yearOverYearExpenseChangePercent:
      percentChange(
        last.expensePaisa,
        yearAgo.expensePaisa
      ),

    topExpenseCategories:
      categoryReport
        .expenseCategories
        .slice(0, 5),

    projection,

    projectionExplanation:
      average === null
        ? "No projection: each of the last three completed months must have recorded expenses."
        : "Illustrative estimate: the average expense of the last three completed months, repeated for the next three months. No seasonality or future bills are modeled.",
  };
}
