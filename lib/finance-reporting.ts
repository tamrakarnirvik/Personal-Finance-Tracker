
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

export type ReportPreset =
  | "this-month"
  | "last-month"
  | "last-90-days"
  | "this-year";

export type ReportTypeFilter =
  | "all"
  | "income"
  | "expense"
  | "transfer";

export interface ReportFilters {
  fromDate: string;
  toDate: string;
  accountId: string;
  categoryId: string;
  type: ReportTypeFilter;
}

export interface ReportLine {
  id: string;
  occurredOn: string;
  type: "income" | "expense" | "transfer";
  description: string;
  account: string;
  category: string;
  amountPaisa: number;
}

export interface ReportMonthlyRow {
  month: string;
  incomePaisa: number;
  expensePaisa: number;
  netPaisa: number;
  transferVolumePaisa: number;
  transactionCount: number;
}

export interface ReportCategoryRow {
  categoryId: string;
  category: string;
  type: "income" | "expense";
  amountPaisa: number;
  transactionCount: number;
  percentage: number;
}

export interface FinancialReport {
  filters: ReportFilters;
  rows: ReportLine[];
  monthly: ReportMonthlyRow[];
  expenseCategories: ReportCategoryRow[];
  incomeCategories: ReportCategoryRow[];
  incomePaisa: number;
  expensePaisa: number;
  netPaisa: number;
  transferVolumePaisa: number;
  transactionCount: number;
  transferCount: number;
}

// ==========================================
// DATE HELPERS
// ==========================================

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function isReportDate(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  return (
    day <=
    new Date(
      Date.UTC(year, month, 0)
    ).getUTCDate()
  );
}

function offsetDate(
  value: string,
  days: number
): string {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day + days
    )
  );

  return (
    `${date.getUTCFullYear()}-` +
    `${pad(date.getUTCMonth() + 1)}-` +
    pad(date.getUTCDate())
  );
}

// ==========================================
// DATE RANGE PRESETS
// ==========================================

export function getReportPresetRange(
  preset: ReportPreset,
  today: string
): {
  fromDate: string;
  toDate: string;
} {
  if (!isReportDate(today)) {
    throw new Error(
      "Invalid current date."
    );
  }

  const [year, month] = today
    .split("-")
    .map(Number);

  const thisMonthStart =
    `${year}-${pad(month)}-01`;

  switch (preset) {
    case "this-month":
      return {
        fromDate: thisMonthStart,
        toDate: today,
      };

    case "last-month": {
      const previousDay = offsetDate(
        thisMonthStart,
        -1
      );

      return {
        fromDate:
          `${previousDay.slice(0, 7)}-01`,
        toDate: previousDay,
      };
    }

    case "last-90-days":
      return {
        fromDate: offsetDate(
          today,
          -89
        ),
        toDate: today,
      };

    case "this-year":
      return {
        fromDate: `${year}-01-01`,
        toDate: today,
      };
  }
}

// ==========================================
// SAFE INTEGER ADDITION
// ==========================================

function safeAdd(
  a: number,
  b: number
): number {
  const result = a + b;

  if (!Number.isSafeInteger(result)) {
    throw new Error(
      "Report amount exceeds the safe integer range."
    );
  }

  return result;
}

// ==========================================
// CATEGORY TOTALS
// ==========================================

function totalCategories(
  rows: Map<string, ReportCategoryRow>,
  total: number
): ReportCategoryRow[] {
  return [...rows.values()]
    .map((row) => ({
      ...row,

      percentage:
        total > 0
          ? (row.amountPaisa / total) * 100
          : 0,
    }))
    .sort(
      (a, b) =>
        b.amountPaisa - a.amountPaisa ||
        a.category.localeCompare(b.category)
    );
}

// ==========================================
// GENERATE FINANCIAL REPORT
// ==========================================

export function buildFinancialReport(args: {
  transactions: readonly FinanceTransaction[];
  accounts: readonly FinanceAccount[];
  categories: readonly FinanceCategory[];
  filters: ReportFilters;
}): FinancialReport {
  const {
    transactions,
    accounts,
    categories,
    filters,
  } = args;

  const {
    fromDate,
    toDate,
    accountId,
    categoryId,
    type,
  } = filters;

  // Validate filters.

  if (
    !isReportDate(fromDate) ||
    !isReportDate(toDate)
  ) {
    throw new Error(
      "Choose valid start and end dates."
    );
  }

  if (fromDate > toDate) {
    throw new Error(
      "Start date cannot be later than end date."
    );
  }

  if (
    ![
      "all",
      "income",
      "expense",
      "transfer",
    ].includes(type)
  ) {
    throw new Error(
      "Invalid report transaction type."
    );
  }

  if (
    accountId &&
    !accounts.some(
      (account) => account.id === accountId
    )
  ) {
    throw new Error(
      "The selected account no longer exists."
    );
  }

  if (
    categoryId &&
    !categories.some(
      (category) => category.id === categoryId
    )
  ) {
    throw new Error(
      "The selected category no longer exists."
    );
  }

  // Build lookup tables.

  const accountNames = new Map(
    accounts.map((account) => [
      account.id,
      account.name,
    ])
  );

  const categoryNames = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ])
  );

  const rows: ReportLine[] = [];

  const monthlyByKey = new Map<
    string,
    ReportMonthlyRow
  >();

  const expensesByCategory = new Map<
    string,
    ReportCategoryRow
  >();

  const incomeByCategory = new Map<
    string,
    ReportCategoryRow
  >();

  let incomePaisa = 0;
  let expensePaisa = 0;
  let transferVolumePaisa = 0;
  let transferCount = 0;

  // ========================================
  // PROCESS SAVED TRANSACTIONS
  // ========================================

  for (const transaction of transactions) {
    if (
      transaction.occurredOn < fromDate ||
      transaction.occurredOn > toDate
    ) {
      continue;
    }

    if (
      type !== "all" &&
      transaction.type !== type
    ) {
      continue;
    }

    const transfer =
      transaction.type === "transfer";

    // ACCOUNT FILTER

    if (accountId) {
      const matchesAccount = transfer
        ? (
            transaction.fromAccountId ===
              accountId ||
            transaction.toAccountId ===
              accountId
          )
        : transaction.accountId ===
            accountId;

      if (!matchesAccount) {
        continue;
      }
    }

    // CATEGORY FILTER

    if (
      categoryId &&
      (
        transfer ||
        transaction.categoryId !== categoryId
      )
    ) {
      continue;
    }

    const month =
      transaction.occurredOn.slice(0, 7);

    let group =
      monthlyByKey.get(month);

    if (!group) {
      group = {
        month,
        incomePaisa: 0,
        expensePaisa: 0,
        netPaisa: 0,
        transferVolumePaisa: 0,
        transactionCount: 0,
      };

      monthlyByKey.set(
        month,
        group
      );
    }

    group.transactionCount += 1;

    // ======================================
    // TRANSFER TRANSACTIONS
    // ======================================

    if (transfer) {
      transferCount += 1;

      transferVolumePaisa = safeAdd(
        transferVolumePaisa,
        transaction.amountPaisa
      );

      group.transferVolumePaisa = safeAdd(
        group.transferVolumePaisa,
        transaction.amountPaisa
      );

      rows.push({
        id: transaction.id,
        occurredOn:
          transaction.occurredOn,

        type: "transfer",

        description:
          transaction.note?.trim() ||
          "Account transfer",

        account:
          `${
            accountNames.get(
              transaction.fromAccountId
            ) ?? "Deleted account"
          } → ${
            accountNames.get(
              transaction.toAccountId
            ) ?? "Deleted account"
          }`,

        category: "Transfer",

        amountPaisa:
          transaction.amountPaisa,
      });

      continue;
    }

    // ======================================
    // INCOME / EXPENSE TRANSACTIONS
    // ======================================

    const isIncome =
      transaction.type === "income";

    const category =
      categoryNames.get(
        transaction.categoryId
      ) ?? "Deleted category";

    const selectedMap = isIncome
      ? incomeByCategory
      : expensesByCategory;

    const savedCategory =
      selectedMap.get(
        transaction.categoryId
      );

    if (savedCategory) {
      savedCategory.amountPaisa = safeAdd(
        savedCategory.amountPaisa,
        transaction.amountPaisa
      );

      savedCategory.transactionCount += 1;
    } else {
      selectedMap.set(
        transaction.categoryId,
        {
          categoryId:
            transaction.categoryId,

          category,

          type:
            transaction.type,

          amountPaisa:
            transaction.amountPaisa,

          transactionCount: 1,
          percentage: 0,
        }
      );
    }

    if (isIncome) {
      incomePaisa = safeAdd(
        incomePaisa,
        transaction.amountPaisa
      );

      group.incomePaisa = safeAdd(
        group.incomePaisa,
        transaction.amountPaisa
      );
    } else {
      expensePaisa = safeAdd(
        expensePaisa,
        transaction.amountPaisa
      );

      group.expensePaisa = safeAdd(
        group.expensePaisa,
        transaction.amountPaisa
      );
    }

    rows.push({
      id: transaction.id,

      occurredOn:
        transaction.occurredOn,

      type:
        transaction.type,

      description:
        transaction.note?.trim() ||
        category,

      account:
        accountNames.get(
          transaction.accountId
        ) ?? "Deleted account",

      category,

      amountPaisa:
        transaction.amountPaisa,
    });
  }

  // ========================================
  // PREPARE MONTHLY SUMMARY
  // ========================================

  const monthly = [
    ...monthlyByKey.values(),
  ]
    .map((row) => ({
      ...row,

      netPaisa:
        row.incomePaisa -
        row.expensePaisa,
    }))
    .sort((a, b) =>
      a.month.localeCompare(b.month)
    );

  // Most recent transactions first.

  rows.sort(
    (a, b) =>
      b.occurredOn.localeCompare(
        a.occurredOn
      ) ||
      b.id.localeCompare(a.id)
  );

  // ========================================
  // FINAL REPORT
  // ========================================

  return {
    filters: {
      ...filters,
    },

    rows,
    monthly,

    expenseCategories:
      totalCategories(
        expensesByCategory,
        expensePaisa
      ),

    incomeCategories:
      totalCategories(
        incomeByCategory,
        incomePaisa
      ),

    incomePaisa,
    expensePaisa,

    netPaisa:
      incomePaisa -
      expensePaisa,

    transferVolumePaisa,

    transactionCount:
      rows.length,

    transferCount,
  };
}
