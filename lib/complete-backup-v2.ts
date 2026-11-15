
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import {
  isMonthlyBudget,
  type MonthlyBudget,
} from "@/lib/budget-planning";

import {
  RECURRING_STORAGE_KEY,
  isRecurringScheduleList,
  type RecurringSchedule,
} from "@/lib/recurring-planning";

import {
  COMPLETE_BACKUP_KEYS,
  validateCompleteBackup,
  type CompleteBackupData,
} from "@/lib/complete-backup-validation";

import {
  restoreCompleteBackup,
} from "@/lib/complete-backup-restore";

export interface CompleteBackupV2 {
  application: "expense-tracker";
  format: "complete-workspace-backup";
  version: 2;
  exportedAt: string;

  data: CompleteBackupData["data"] & {
    recurring: RecurringSchedule[];
  };

  storage: CompleteBackupData["storage"] & {
    [RECURRING_STORAGE_KEY]: string | null;
  };
}

export type SupportedCompleteBackup =
  | CompleteBackupData
  | CompleteBackupV2;

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validatedSchedules(
  value: unknown
): RecurringSchedule[] {
  if (!isRecurringScheduleList(value)) {
    throw new Error(
      "Recurring schedules contain invalid or duplicate records."
    );
  }

  for (const schedule of value) {
    if (!/^[A-Za-z0-9-]+$/.test(schedule.id)) {
      throw new Error(
        `Recurring schedule ${schedule.name} has an unsupported ID.`
      );
    }
  }

  return value;
}

function readStoredArray<T>(
  storage: Storage,
  key: string,
  validate: (value: unknown) => value is T[],
): T[] {
  const raw = storage.getItem(key);

  if (raw === null) return [];

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Cannot read existing data in ${key}.`
    );
  }

  if (!validate(parsed)) {
    throw new Error(
      `Invalid existing data in ${key}. Export was cancelled.`
    );
  }

  return parsed;
}

// Read budgets and recurring schedules.
// Invalid saved data must never be silently omitted.
export function readBackupExtras(
  storage: Storage
): {
  budgets: MonthlyBudget[];
  recurring: RecurringSchedule[];
} {
  const budgets = readStoredArray(
    storage,
    COMPLETE_BACKUP_KEYS.budgets,
    (value): value is MonthlyBudget[] =>
      Array.isArray(value) &&
      value.every(isMonthlyBudget)
  );

  const recurring = validatedSchedules(
    readStoredArray(
      storage,
      RECURRING_STORAGE_KEY,
      isRecurringScheduleList
    )
  );

  return { budgets, recurring };
}

// Create a full backup from the current
// finance providers and stored schedules.
export function createCompleteBackupV2(
  records: {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    categories: FinanceCategory[];
    customCategories: FinanceCategory[];
  },
  extras: {
    budgets: MonthlyBudget[];
    recurring: RecurringSchedule[];
  }
): CompleteBackupV2 {
  const backup: CompleteBackupV2 = {
    application: "expense-tracker",
    format: "complete-workspace-backup",
    version: 2,
    exportedAt: new Date().toISOString(),

    data: {
      accounts: records.accounts,
      transactions: records.transactions,
      categories: records.categories,
      budgets: extras.budgets,
      recurring: extras.recurring,
    },

    storage: {
      [COMPLETE_BACKUP_KEYS.accounts]:
        JSON.stringify(records.accounts),

      [COMPLETE_BACKUP_KEYS.transactions]:
        JSON.stringify(records.transactions),

      [COMPLETE_BACKUP_KEYS.customCategories]:
        JSON.stringify(records.customCategories),

      [COMPLETE_BACKUP_KEYS.budgets]:
        JSON.stringify(extras.budgets),

      [RECURRING_STORAGE_KEY]:
        JSON.stringify(extras.recurring),
    },
  };

  return validateSupportedCompleteBackup(
    backup
  ) as CompleteBackupV2;
}

// Accept the original V1 format and the
// new V2 format containing recurring schedules.
export function validateSupportedCompleteBackup(
  input: unknown
): SupportedCompleteBackup {
  if (!isObject(input)) {
    throw new Error(
      "Not a valid backup object."
    );
  }

  if (input.version === 1) {
    return validateCompleteBackup(input);
  }

  if (
    input.version !== 2 ||
    !isObject(input.data) ||
    !isObject(input.storage)
  ) {
    throw new Error(
      "Unsupported complete backup version or missing data."
    );
  }

  // Reuse the established Phase 7 financial
  // validator, including its integrity audit.
  const legacyPart = validateCompleteBackup({
    ...input,
    version: 1,

    data: {
      accounts: input.data.accounts,
      transactions: input.data.transactions,
      categories: input.data.categories,
      budgets: input.data.budgets,
    },

    storage: input.storage,
  });

  const recurring = validatedSchedules(
    input.data.recurring
  );

  if (
    !Object.prototype.hasOwnProperty.call(
      input.storage,
      RECURRING_STORAGE_KEY
    )
  ) {
    throw new Error(
      "Recurring schedule snapshot is missing."
    );
  }

  const raw =
    input.storage[RECURRING_STORAGE_KEY];

  if (
    raw !== null &&
    typeof raw !== "string"
  ) {
    throw new Error(
      "Recurring schedule snapshot must be JSON or null."
    );
  }

  if (
    raw === null &&
    recurring.length > 0
  ) {
    throw new Error(
      "Recurring records exist but the storage snapshot is empty."
    );
  }

  if (typeof raw === "string") {
    let saved: unknown;

    try {
      saved = JSON.parse(raw);
    } catch {
      throw new Error(
        "Recurring schedule snapshot is not readable JSON."
      );
    }

    validatedSchedules(saved);

    if (
      JSON.stringify(saved) !==
      JSON.stringify(recurring)
    ) {
      throw new Error(
        "Recurring schedule snapshot does not match the backup data."
      );
    }
  }

  // Validate every schedule's account
  // and category against the backup.
  const accountIds = new Set(
    legacyPart.data.accounts.map(
      (account) => account.id
    )
  );

  const categoryTypes = new Map(
    legacyPart.data.categories.map(
      (category) => [
        category.id,
        category.type,
      ])
  );

  for (const schedule of recurring) {
    if (!accountIds.has(schedule.accountId)) {
      throw new Error(
        `Recurring schedule ${schedule.name} references a missing account.`
      );
    }

    if (
      categoryTypes.get(
        schedule.categoryId
      ) !== schedule.type
    ) {
      throw new Error(
        `Recurring schedule ${schedule.name} has a missing or mismatched category.`
      );
    }
  }

  return input as unknown as CompleteBackupV2;
}

// Write a storage key and verify its value.
function storeVerified(
  storage: Storage,
  key: string,
  value: string | null
): void {
  if (value === null) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, value);
  }

  if (
    storage.getItem(key) !== value
  ) {
    throw new Error(
      `Write failed for ${key}.`
    );
  }
}

// Restore V1 or V2, protecting existing
// schedules from a legacy restore.
export function restoreSupportedCompleteBackup(
  input: unknown,
  storage: Storage
): void {
  const backup =
    validateSupportedCompleteBackup(input);

  if (backup.version === 1) {
    const existing =
      readBackupExtras(storage).recurring;

    if (existing.length > 0) {
      throw new Error(
        "This older backup does not include recurring schedules. Export them, " +
        "and use a version 2 backup before replacing financial records."
      );
    }

    restoreCompleteBackup(
      backup,
      storage
    );

    return;
  }

  const keys = [
    COMPLETE_BACKUP_KEYS.accounts,
    COMPLETE_BACKUP_KEYS.transactions,
    COMPLETE_BACKUP_KEYS.customCategories,
    COMPLETE_BACKUP_KEYS.budgets,
    RECURRING_STORAGE_KEY,
  ] as const;

  const next: Record<
    (typeof keys)[number],
    string | null
  > = {
    [COMPLETE_BACKUP_KEYS.accounts]:
      JSON.stringify(
        backup.data.accounts
      ),

    [COMPLETE_BACKUP_KEYS.transactions]:
      JSON.stringify(
        backup.data.transactions
      ),

    [COMPLETE_BACKUP_KEYS.customCategories]:
      backup.storage[
        COMPLETE_BACKUP_KEYS.customCategories
      ],

    [COMPLETE_BACKUP_KEYS.budgets]:
      JSON.stringify(
        backup.data.budgets
      ),

    [RECURRING_STORAGE_KEY]:
      JSON.stringify(
        backup.data.recurring
      ),
  };

  const previous = {} as Record<
    (typeof keys)[number],
    string | null
  >;

  // Read all original values before writing.
  for (const key of keys) {
    previous[key] =
      storage.getItem(key);
  }

  try {
    for (const key of keys) {
      storeVerified(
        storage,
        key,
        next[key]
      );
    }
  } catch (error) {
    // Best-effort rollback of all five keys.
    const failed: string[] = [];

    for (const key of keys) {
      try {
        storeVerified(
          storage,
          key,
          previous[key]
        );
      } catch {
        failed.push(key);
      }
    }

    if (failed.length > 0) {
      throw new Error(
        `Restore and rollback incomplete: ${failed.join(", ")}. Use your recovery file.`
      );
    }

    throw new Error(
      `Restore failed. Previous storage values were restored. ${
        error instanceof Error
          ? error.message
          : "Storage error"
      }`
    );
  }
}
