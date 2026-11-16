
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import {
  COMPLETE_BACKUP_KEYS,
} from "@/lib/complete-backup-validation";

import {
  RECURRING_STORAGE_KEY,
} from "@/lib/recurring-planning";

import {
  RECURRING_AUTOMATION_KEY,
} from "@/lib/recurring-automation";

import {
  createCompleteBackupV3,
  validateAnyCompleteBackup,
  restoreAnyCompleteBackup,
  type AnyCompleteBackup,
  type CompleteBackupV3,
} from "@/lib/complete-backup-v3";

import {
  GOALS_STORAGE_KEY,
  isGoalWorkspace,
  parseGoalWorkspace,
  type GoalWorkspace,
} from "@/lib/goal-planning";

// ======================================
// BACKUP V4 TYPES
// ======================================

export interface CompleteBackupV4 {
  application: "expense-tracker";
  format: "complete-workspace-backup";
  version: 4;
  exportedAt: string;

  data: CompleteBackupV3["data"] & {
    goals: GoalWorkspace;
  };

  storage: CompleteBackupV3["storage"] & {
    [GOALS_STORAGE_KEY]: string;
  };
}

export type AnyBackupWithGoals =
  | AnyCompleteBackup
  | CompleteBackupV4;

type Records = {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  customCategories: FinanceCategory[];
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

// ======================================
// CREATE COMPLETE BACKUP V4
// ======================================

export function createCompleteBackupV4(
  records: Records,
  storage: Storage
): CompleteBackupV4 {
  const v3 = createCompleteBackupV3(
    records,
    storage
  );

  const goals = parseGoalWorkspace(
    storage.getItem(
      GOALS_STORAGE_KEY
    )
  );

  const backup: CompleteBackupV4 = {
    ...v3,
    version: 4,

    data: {
      ...v3.data,
      goals,
    },

    storage: {
      ...v3.storage,

      [GOALS_STORAGE_KEY]:
        JSON.stringify(goals),
    },
  };

  return validateBackupWithGoals(
    backup
  ) as CompleteBackupV4;
}

// ======================================
// VALIDATE BACKUP V1–V4
// ======================================

export function validateBackupWithGoals(
  input: unknown
): AnyBackupWithGoals {
  if (!isRecord(input)) {
    throw new Error(
      "Backup must be a JSON object."
    );
  }

  // Older complete backups continue using
  // the existing version 1–3 validators.

  if (input.version !== 4) {
    return validateAnyCompleteBackup(
      input
    );
  }

  if (
    !isRecord(input.data) ||
    !isRecord(input.storage)
  ) {
    throw new Error(
      "Missing backup data or snapshots."
    );
  }

  // Validate accounts, transactions,
  // categories, budgets, recurring
  // schedules and automation settings.

  validateAnyCompleteBackup({
    ...input,
    version: 3,
  });

  // Validate savings goals and movements.

  if (
    !isGoalWorkspace(
      input.data.goals
    )
  ) {
    throw new Error(
      "Invalid goals or goal allocations."
    );
  }

  const raw =
    input.storage[
      GOALS_STORAGE_KEY
    ];

  if (typeof raw !== "string") {
    throw new Error(
      "Goal storage snapshot is missing."
    );
  }

  let snapshot: unknown;

  try {
    snapshot = JSON.parse(raw);
  } catch {
    throw new Error(
      "Goal storage snapshot is not valid JSON."
    );
  }

  if (
    !isGoalWorkspace(snapshot) ||
    JSON.stringify(snapshot) !==
      JSON.stringify(
        input.data.goals
      )
  ) {
    throw new Error(
      "Goal storage snapshot does not match the backup data."
    );
  }

  return input as unknown as CompleteBackupV4;
}

// ======================================
// VERIFIED STORAGE WRITE
// ======================================

function verifiedWrite(
  storage: Storage,
  key: string,
  value: string | null
) {
  if (value === null) {
    storage.removeItem(key);
  } else {
    storage.setItem(
      key,
      value
    );
  }

  if (
    storage.getItem(key) !== value
  ) {
    throw new Error(
      `Storage write failed: ${key}`
    );
  }
}

// ======================================
// RESTORE BACKUP V1–V4
// ======================================

export function restoreBackupWithGoals(
  input: unknown,
  storage: Storage
): void {
  const backup =
    validateBackupWithGoals(input);

  const currentGoals =
    parseGoalWorkspace(
      storage.getItem(
        GOALS_STORAGE_KEY
      )
    );

  // Protect existing goals if a user
  // attempts to restore an older backup
  // that does not contain goal data.

  if (backup.version !== 4) {
    if (
      currentGoals.goals.length > 0 ||
      currentGoals.movements.length > 0
    ) {
      throw new Error(
        "This older backup has no savings goals. Export a v4 recovery copy and use a v4 backup to avoid losing goal history."
      );
    }

    restoreAnyCompleteBackup(
      backup,
      storage
    );

    return;
  }

  // These are the seven persisted datasets.

  const keys = [
    COMPLETE_BACKUP_KEYS.accounts,
    COMPLETE_BACKUP_KEYS.transactions,
    COMPLETE_BACKUP_KEYS.customCategories,
    COMPLETE_BACKUP_KEYS.budgets,
    RECURRING_STORAGE_KEY,
    RECURRING_AUTOMATION_KEY,
    GOALS_STORAGE_KEY,
  ] as const;

  // Never enable automatic posting after
  // restoring financial records.

  const automation = {
    ...backup.data.automation,
    autoPostDueToday: false,
  };

  const next = new Map<
    string,
    string | null
  >([
    [
      COMPLETE_BACKUP_KEYS.accounts,
      JSON.stringify(
        backup.data.accounts
      ),
    ],
    [
      COMPLETE_BACKUP_KEYS.transactions,
      JSON.stringify(
        backup.data.transactions
      ),
    ],
    [
      COMPLETE_BACKUP_KEYS.customCategories,
      backup.storage[
        COMPLETE_BACKUP_KEYS.customCategories
      ],
    ],
    [
      COMPLETE_BACKUP_KEYS.budgets,
      JSON.stringify(
        backup.data.budgets
      ),
    ],
    [
      RECURRING_STORAGE_KEY,
      JSON.stringify(
        backup.data.recurring
      ),
    ],
    [
      RECURRING_AUTOMATION_KEY,
      JSON.stringify(
        automation
      ),
    ],
    [
      GOALS_STORAGE_KEY,
      JSON.stringify(
        backup.data.goals
      ),
    ],
  ]);

  // Save the current values for rollback.

  const previous = new Map<
    string,
    string | null
  >();

  for (const key of keys) {
    previous.set(
      key,
      storage.getItem(key)
    );
  }

  // Perform restoration.

  try {
    for (const [key, value] of next) {
      verifiedWrite(
        storage,
        key,
        value
      );
    }
  } catch (cause) {
    // Best-effort rollback.

    const failures: string[] = [];

    for (const [key, value] of previous) {
      try {
        verifiedWrite(
          storage,
          key,
          value
        );
      } catch {
        failures.push(key);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Restore failed and rollback was incomplete for ${failures.join(", ")}. Use your recovery file.`
      );
    }

    throw new Error(
      `Restore failed; previous data was restored. ${
        cause instanceof Error
          ? cause.message
          : "Storage error"
      }`
    );
  }
}
