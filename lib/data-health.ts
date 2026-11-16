
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import type {
  GoalWorkspace,
} from "@/lib/goal-planning";

import type {
  RecurringSchedule,
} from "@/lib/recurring-planning";

import {
  isGoalWorkspace,
} from "@/lib/goal-planning";

import {
  isRecurringScheduleList,
} from "@/lib/recurring-planning";

import {
  isReportDate,
} from "@/lib/finance-reporting";

export type HealthSeverity =
  | "critical"
  | "warning";

export interface DataHealthIssue {
  code: string;
  severity: HealthSeverity;
  title: string;
  explanation: string;
  count: number;
}

export interface DataHealthReport {
  status:
    | "healthy"
    | "review"
    | "attention";

  accountCount: number;
  transactionCount: number;
  goalCount: number;
  scheduleCount: number;

  issues: DataHealthIssue[];
}

// ==========================================
// ANALYZE DATA HEALTH
// ==========================================

export function analyzeDataHealth(input: {
  accounts: readonly FinanceAccount[];
  transactions: readonly FinanceTransaction[];
  categories: readonly FinanceCategory[];
  goals: GoalWorkspace;
  schedules: readonly RecurringSchedule[];
  goalsError?: string | null;
  schedulesError?: string | null;
}): DataHealthReport {
  const {
    accounts,
    transactions,
    categories,
    goals,
    schedules,
  } = input;

  const issues:
    DataHealthIssue[] = [];

  // ========================================
  // HELPER — REGISTER ISSUES
  // ========================================

  function push(
    code: string,
    severity: HealthSeverity,
    title: string,
    explanation: string,
    count: number
  ) {
    if (count > 0) {
      issues.push({
        code,
        severity,
        title,
        explanation,
        count,
      });
    }
  }

  const accountIds = new Set(
    accounts.map(
      (account) => account.id
    )
  );

  const categoryTypes = new Map(
    categories.map(
      (category) => [
        category.id,
        category.type,
      ]
    )
  );

  const seenTransactions =
    new Set<string>();

  let duplicates = 0;
  let badAmounts = 0;
  let badDates = 0;
  let missingAccounts = 0;
  let missingCategories = 0;
  let mismatchedCategories = 0;
  let invalidTransfers = 0;

  // ========================================
  // CHECK FINANCIAL TRANSACTIONS
  // ========================================

  for (const entry of transactions) {
    if (
      seenTransactions.has(entry.id)
    ) {
      duplicates += 1;
    }

    seenTransactions.add(entry.id);

    if (
      !Number.isSafeInteger(
        entry.amountPaisa
      ) ||
      entry.amountPaisa <= 0
    ) {
      badAmounts += 1;
    }

    if (
      !isReportDate(entry.occurredOn)
    ) {
      badDates += 1;
    }

    if (entry.type === "transfer") {
      if (
        !accountIds.has(
          entry.fromAccountId
        ) ||
        !accountIds.has(
          entry.toAccountId
        )
      ) {
        missingAccounts += 1;
      }

      if (
        entry.fromAccountId ===
        entry.toAccountId
      ) {
        invalidTransfers += 1;
      }
    } else {
      if (
        !accountIds.has(
          entry.accountId
        )
      ) {
        missingAccounts += 1;
      }

      const categoryType =
        categoryTypes.get(
          entry.categoryId
        );

      if (categoryType === undefined) {
        missingCategories += 1;
      } else if (
        categoryType !== entry.type
      ) {
        mismatchedCategories += 1;
      }
    }
  }

  // ========================================
  // REGISTER TRANSACTION ERRORS
  // ========================================

  push(
    "DUPLICATE_TRANSACTION_IDS",
    "critical",
    "Duplicate transaction IDs",
    "The same ID occurs multiple times; duplicate entries can distort balances.",
    duplicates
  );

  push(
    "INVALID_TRANSACTION_AMOUNT",
    "critical",
    "Invalid transaction amounts",
    "Amounts must be positive safe integers in NPR paisa.",
    badAmounts
  );

  push(
    "INVALID_TRANSACTION_DATE",
    "critical",
    "Invalid transaction dates",
    "Transactions contain impossible calendar dates.",
    badDates
  );

  push(
    "MISSING_ACCOUNTS",
    "critical",
    "Missing account references",
    "Transactions refer to accounts that no longer exist.",
    missingAccounts
  );

  push(
    "INVALID_TRANSFERS",
    "critical",
    "Invalid transfers",
    "Transfers must use two different accounts.",
    invalidTransfers
  );

  push(
    "MISSING_CATEGORIES",
    "warning",
    "Missing categories",
    "Some transactions refer to deleted or unknown categories.",
    missingCategories
  );

  push(
    "CATEGORY_TYPE_MISMATCH",
    "warning",
    "Category/type mismatch",
    "An income transaction uses an expense category or vice versa.",
    mismatchedCategories
  );

  // ========================================
  // VALIDATE GOALS AND SCHEDULES
  // ========================================

  const invalidGoalStore =
    Boolean(input.goalsError) ||
    !isGoalWorkspace(goals);

  const invalidRecurringStore =
    Boolean(input.schedulesError) ||
    !isRecurringScheduleList(
      [...schedules]
    );

  push(
    "INVALID_GOALS",
    "critical",
    "Savings goals need attention",
    input.goalsError ??
      "Goal or allocation data failed validation.",
    Number(invalidGoalStore)
  );

  push(
    "INVALID_RECURRING",
    "critical",
    "Recurring schedules need attention",
    input.schedulesError ??
      "Recurring schedule data failed validation.",
    Number(invalidRecurringStore)
  );

  // ========================================
  // RECURRING ACCOUNT / CATEGORY LINKS
  // ========================================

  const categoryIds = new Set(
    categories.map(
      (item) => item.id
    )
  );

  let missingScheduleReferences = 0;

  for (const schedule of schedules) {
    if (
      !accountIds.has(
        schedule.accountId
      ) ||
      !categoryIds.has(
        schedule.categoryId
      )
    ) {
      missingScheduleReferences += 1;
    } else if (
      categoryTypes.get(
        schedule.categoryId
      ) !== schedule.type
    ) {
      missingScheduleReferences += 1;
    }
  }

  push(
    "RECURRING_REFERENCES",
    "warning",
    "Recurring schedule references",
    "Some schedules use accounts or categories that are unavailable or of the wrong type.",
    missingScheduleReferences
  );

  const critical = issues.some(
    (issue) =>
      issue.severity === "critical"
  );

  return {
    status: critical
      ? "attention"
      : issues.length
        ? "review"
        : "healthy",

    accountCount:
      accounts.length,

    transactionCount:
      transactions.length,

    goalCount:
      goals.goals.length,

    scheduleCount:
      schedules.length,

    issues,
  };
}
