
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../types/finance";

import { auditFinanceData } from "./finance-integrity";

import {
  isMonthlyBudget,
  type MonthlyBudget,
} from "./budget-planning";

export const COMPLETE_BACKUP_KEYS = {
  accounts: "expense-tracker-accounts-v1",
  transactions: "expense-tracker-transactions-v1",
  customCategories: "expense-tracker-custom-categories-v1",
  budgets: "expense-tracker-budgets-v1",
} as const;

export type CompleteBackupStorageKey =
  (typeof COMPLETE_BACKUP_KEYS)[keyof typeof COMPLETE_BACKUP_KEYS];

export type CompleteBackupStorage = Record<
  CompleteBackupStorageKey,
  string | null
>;

export interface CompleteBackupData {
  application: "expense-tracker";
  format: "complete-workspace-backup";
  version: 1;
  exportedAt: string;

  data: {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    categories: FinanceCategory[];
    budgets: MonthlyBudget[];
  };

  storage: CompleteBackupStorage;
}

export interface CompleteBackupPreview {
  exportedAt: string;
  accounts: number;
  transactions: number;
  categories: number;
  budgets: number;
  storageKeys: number;
}

function record(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function nonempty(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function uniqueIds(
  items: { id: string }[]
): boolean {
  return (
    new Set(items.map((item) => item.id)).size ===
    items.length
  );
}

function validDate(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(
    `${value}T12:00:00Z`
  );

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isAccount(
  value: unknown
): value is FinanceAccount {
  if (!record(value)) return false;

  return (
    nonempty(value.id) &&
    nonempty(value.name) &&
    (
      value.type === "cash" ||
      value.type === "bank" ||
      value.type === "wallet"
    ) &&
    value.currency === "NPR" &&
    Number.isSafeInteger(value.openingBalancePaisa) &&
    (value.openingBalancePaisa as number) >= 0
  );
}

function isCategory(
  value: unknown
): value is FinanceCategory {
  if (!record(value)) return false;

  return (
    nonempty(value.id) &&
    nonempty(value.name) &&
    (
      value.type === "income" ||
      value.type === "expense"
    )
  );
}

function isTransaction(
  value: unknown
): value is FinanceTransaction {
  if (!record(value)) return false;

  if (
    !nonempty(value.id) ||
    !validDate(value.occurredOn) ||
    !Number.isSafeInteger(value.amountPaisa) ||
    (value.amountPaisa as number) <= 0 ||
    (
      value.note !== undefined &&
      typeof value.note !== "string"
    )
  ) {
    return false;
  }

  if (value.type === "transfer") {
    return (
      nonempty(value.fromAccountId) &&
      nonempty(value.toAccountId) &&
      value.fromAccountId !== value.toAccountId
    );
  }

  return (
    (
      value.type === "income" ||
      value.type === "expense"
    ) &&
    nonempty(value.accountId) &&
    nonempty(value.categoryId)
  );
}

function assertArray<T>(
  value: unknown,
  label: string,
  predicate: (value: unknown) => value is T
): T[] {
  if (
    !Array.isArray(value) ||
    !value.every(predicate)
  ) {
    throw new Error(
      `${label} contains invalid records.`
    );
  }

  return value as T[];
}

function readSnapshot(
  storage: Record<string, unknown>,
  key: CompleteBackupStorageKey
): unknown[] | null {
  if (
    !Object.prototype.hasOwnProperty.call(
      storage,
      key
    )
  ) {
    throw new Error(
      `Missing storage snapshot: ${key}`
    );
  }

  const raw = storage[key];

  if (raw === null) return null;

  if (typeof raw !== "string") {
    throw new Error(
      `Invalid storage snapshot: ${key}`
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Unreadable JSON in storage snapshot: ${key}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Storage snapshot is not an array: ${key}`
    );
  }

  return parsed;
}

export function validateCompleteBackup(
  input: unknown
): CompleteBackupData {
  if (!record(input)) {
    throw new Error(
      "The selected file is not a backup object."
    );
  }

  if (
    input.application !== "expense-tracker" ||
    input.format !== "complete-workspace-backup" ||
    input.version !== 1
  ) {
    throw new Error(
      "This is not a supported Expense Tracker complete backup."
    );
  }

  if (
    typeof input.exportedAt !== "string" ||
    Number.isNaN(Date.parse(input.exportedAt))
  ) {
    throw new Error(
      "The backup export date is invalid."
    );
  }

  if (!record(input.data)) {
    throw new Error("Backup data is missing.");
  }

  const accounts = assertArray(
    input.data.accounts,
    "Accounts",
    isAccount
  );

  const transactions = assertArray(
    input.data.transactions,
    "Transactions",
    isTransaction
  );

  const categories = assertArray(
    input.data.categories,
    "Categories",
    isCategory
  );

  const budgets = assertArray(
    input.data.budgets,
    "Budgets",
    isMonthlyBudget
  );

  if (
    !uniqueIds(accounts) ||
    !uniqueIds(transactions) ||
    !uniqueIds(categories) ||
    !uniqueIds(budgets)
  ) {
    throw new Error(
      "The backup contains duplicate record IDs."
    );
  }

  const accountIds = new Set(
    accounts.map((account) => account.id)
  );

  const categoryById = new Map(
    categories.map((category) => [
      category.id,
      category,
    ])
  );

  // Check all transaction references.

  for (const transaction of transactions) {
    if (transaction.type === "transfer") {
      if (
        !accountIds.has(transaction.fromAccountId) ||
        !accountIds.has(transaction.toAccountId)
      ) {
        throw new Error(
          `Transfer ${transaction.id} refers to an unknown account.`
        );
      }
    } else if (
      !accountIds.has(transaction.accountId) ||
      categoryById.get(transaction.categoryId)?.type !==
        transaction.type
    ) {
      throw new Error(
        `Transaction ${transaction.id} has an invalid account or category.`
      );
    }
  }

  // Check that budgets use expense categories.

  const monthCategories = new Set<string>();

  for (const budget of budgets) {
    if (
      categoryById.get(budget.categoryId)?.type !==
      "expense"
    ) {
      throw new Error(
        `Budget ${budget.id} uses an unknown or non-expense category.`
      );
    }

    const key =
      `${budget.monthKey}:${budget.categoryId}`;

    if (monthCategories.has(key)) {
      throw new Error(
        "Duplicate budgets exist for the same month and category."
      );
    }

    monthCategories.add(key);
  }

  // Run the existing financial integrity audit.

  const fatalIssues = auditFinanceData(
    accounts,
    transactions,
    categories
  ).filter(
    (issue) => issue.severity === "error"
  );

  if (fatalIssues.length > 0) {
    throw new Error(
      `Financial integrity check failed: ${fatalIssues[0].message}`
    );
  }

  // Validate original localStorage snapshots.

  if (!record(input.storage)) {
    throw new Error(
      "The original storage snapshots are missing."
    );
  }

  const snapshotAccounts = readSnapshot(
    input.storage,
    COMPLETE_BACKUP_KEYS.accounts
  );

  const snapshotTransactions = readSnapshot(
    input.storage,
    COMPLETE_BACKUP_KEYS.transactions
  );

  const snapshotCustomCategories = readSnapshot(
    input.storage,
    COMPLETE_BACKUP_KEYS.customCategories
  );

  const snapshotBudgets = readSnapshot(
    input.storage,
    COMPLETE_BACKUP_KEYS.budgets
  );

  // Validate accounts snapshot.

  if (snapshotAccounts !== null) {
    assertArray(
      snapshotAccounts,
      "Account snapshot",
      isAccount
    );
  }

  // Validate transactions snapshot.

  if (snapshotTransactions !== null) {
    assertArray(
      snapshotTransactions,
      "Transaction snapshot",
      isTransaction
    );
  }

  // Validate custom categories snapshot.

  if (snapshotCustomCategories !== null) {
    const customCategories = assertArray(
      snapshotCustomCategories,
      "Custom-category snapshot",
      isCategory
    );

    if (!uniqueIds(customCategories)) {
      throw new Error(
        "The custom-category snapshot contains duplicate IDs."
      );
    }

    for (const category of customCategories) {
      const canonical = categoryById.get(
        category.id
      );

      if (
        !canonical ||
        canonical.name !== category.name ||
        canonical.type !== category.type
      ) {
        throw new Error(
          "Custom-category storage does not match the backup categories."
        );
      }
    }
  }

  // Validate monthly budget snapshot.

  if (snapshotBudgets !== null) {
    const storedBudgets = assertArray(
      snapshotBudgets,
      "Budget snapshot",
      isMonthlyBudget
    );

    if (
      storedBudgets.length !== budgets.length ||
      storedBudgets.some(
        (saved) =>
          !budgets.some(
            (budget) =>
              budget.id === saved.id &&
              budget.monthKey === saved.monthKey &&
              budget.categoryId === saved.categoryId &&
              budget.limitPaisa === saved.limitPaisa
          )
      )
    ) {
      throw new Error(
        "Stored budgets do not match the exported budget records."
      );
    }
  } else if (budgets.length > 0) {
    throw new Error(
      "The budget snapshot is missing even though budget records exist."
    );
  }

  return input as unknown as CompleteBackupData;
}

export function getCompleteBackupPreview(
  backup: CompleteBackupData
): CompleteBackupPreview {
  return {
    exportedAt: backup.exportedAt,
    accounts: backup.data.accounts.length,
    transactions: backup.data.transactions.length,
    categories: backup.data.categories.length,
    budgets: backup.data.budgets.length,
    storageKeys: Object.keys(
      COMPLETE_BACKUP_KEYS
    ).length,
  };
}
