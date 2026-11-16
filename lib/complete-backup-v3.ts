
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import {
  COMPLETE_BACKUP_KEYS,
} from "@/lib/complete-backup-validation";

import {
  createCompleteBackupV2,
  readBackupExtras,
  validateSupportedCompleteBackup,
  type CompleteBackupV2,
  type SupportedCompleteBackup,
} from "@/lib/complete-backup-v2";

import {
  RECURRING_STORAGE_KEY,
  isRecurringScheduleList,
} from "@/lib/recurring-planning";

import {
  RECURRING_AUTOMATION_KEY,
  isRecurringAutomationSettings,
  readRecurringAutomationSettings,
  type RecurringAutomationSettings,
} from "@/lib/recurring-automation";

// ==========================================
// BACKUP V3 TYPES
// ==========================================

export interface CompleteBackupV3 {
  application: "expense-tracker";
  format: "complete-workspace-backup";
  version: 3;
  exportedAt: string;

  data: CompleteBackupV2["data"] & {
    automation: RecurringAutomationSettings;
  };

  storage: CompleteBackupV2["storage"] & {
    [RECURRING_AUTOMATION_KEY]: string;
  };
}

export type AnyCompleteBackup =
  | SupportedCompleteBackup
  | CompleteBackupV3;

// ==========================================
// HELPERS
// ==========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

// ==========================================
// READ AUTOMATION PREFERENCES
// ==========================================

export function readAutomationForBackup(
  storage: Storage
): RecurringAutomationSettings {
  const raw = storage.getItem(
    RECURRING_AUTOMATION_KEY
  );

  const result =
    readRecurringAutomationSettings(raw);

  if (result.error) {
    throw new Error(
      "Automation preferences are unreadable. " +
      "Backup/restore cancelled: " +
      result.error
    );
  }

  return result.settings;
}

// ==========================================
// CREATE COMPLETE BACKUP V3
// ==========================================

export function createCompleteBackupV3(
  records: {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    categories: FinanceCategory[];
    customCategories: FinanceCategory[];
  },
  storage: Storage
): CompleteBackupV3 {
  // Reuse the validated Phase 9 backup.
  const v2 = createCompleteBackupV2(
    records,
    readBackupExtras(storage)
  );

  const automation =
    readAutomationForBackup(storage);

  const backup: CompleteBackupV3 = {
    ...v2,
    version: 3,

    data: {
      ...v2.data,
      automation,
    },

    storage: {
      ...v2.storage,

      [RECURRING_AUTOMATION_KEY]:
        JSON.stringify(automation),
    },
  };

  return validateAnyCompleteBackup(
    backup
  ) as CompleteBackupV3;
}

// ==========================================
// VALIDATE V1, V2 AND V3 BACKUPS
// ==========================================

export function validateAnyCompleteBackup(
  input: unknown
): AnyCompleteBackup {
  if (!isRecord(input)) {
    throw new Error(
      "Backup must be a JSON object."
    );
  }

  if (
    input.version === 1 ||
    input.version === 2
  ) {
    return validateSupportedCompleteBackup(
      input
    );
  }

  if (
    input.version !== 3 ||
    !isRecord(input.data) ||
    !isRecord(input.storage)
  ) {
    throw new Error(
      "Unsupported complete backup version or missing data."
    );
  }

  // Validate financial records and schedules
  // using the established V2 validation.

  validateSupportedCompleteBackup({
    ...input,
    version: 2,
  });

  // Validate automation preferences.

  if (
    !isRecurringAutomationSettings(
      input.data.automation
    )
  ) {
    throw new Error(
      "Backup automation preferences are invalid."
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      input.storage,
      RECURRING_AUTOMATION_KEY
    )
  ) {
    throw new Error(
      "Backup automation storage snapshot is missing."
    );
  }

  const raw =
    input.storage[
      RECURRING_AUTOMATION_KEY
    ];

  if (typeof raw !== "string") {
    throw new Error(
      "Backup automation storage snapshot must be JSON."
    );
  }

  let saved: unknown;

  try {
    saved = JSON.parse(raw);
  } catch {
    throw new Error(
      "Backup automation storage snapshot is not valid JSON."
    );
  }

  if (
    !isRecurringAutomationSettings(saved) ||
    JSON.stringify(saved) !==
      JSON.stringify(
        input.data.automation
      )
  ) {
    throw new Error(
      "Backup automation snapshot does not match its data."
    );
  }

  return input as unknown as CompleteBackupV3;
}

// ==========================================
// VERIFIED LOCAL STORAGE WRITE
// ==========================================

function writeVerified(
  storage: Storage,
  key: string,
  value: string | null
): void {
  if (value === null) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, value);
  }

  if (storage.getItem(key) !== value) {
    throw new Error(
      `Storage verification failed for ${key}.`
    );
  }
}

// ==========================================
// RESTORE V1, V2 OR V3
// ==========================================

export function restoreAnyCompleteBackup(
  input: unknown,
  storage: Storage
): void {
  // Validate before changing records.

  const backup =
    validateAnyCompleteBackup(input);

  const currentAutomation =
    readAutomationForBackup(storage);

  // V1 has no recurring schedules.
  // Do not replace finance data while
  // existing schedules reference it.

  if (backup.version === 1) {
    const rawSchedules = storage.getItem(
      RECURRING_STORAGE_KEY
    );

    if (rawSchedules !== null) {
      let saved: unknown;

      try {
        saved = JSON.parse(
          rawSchedules
        );
      } catch {
        throw new Error(
          "Existing recurring schedules are unreadable. Restore blocked."
        );
      }

      if (!isRecurringScheduleList(saved)) {
        throw new Error(
          "Existing recurring schedules are invalid. Restore blocked."
        );
      }

      if (saved.length > 0) {
        throw new Error(
          "V1 backups lack recurring schedules. Use a V2 or V3 backup instead."
        );
      }
    }
  }

  // Prepare financial storage values.

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
  ]);

  // V2 and V3 contain recurring schedules.

  if (
    backup.version === 2 ||
    backup.version === 3
  ) {
    next.set(
      RECURRING_STORAGE_KEY,
      JSON.stringify(
        backup.data.recurring
      )
    );
  }

  // Preserve older backup compatibility.

  const sourceAutomation =
    backup.version === 3
      ? backup.data.automation
      : currentAutomation;

  // Safety policy:
  // ALWAYS disable auto-posting after restore.

  next.set(
    RECURRING_AUTOMATION_KEY,
    JSON.stringify({
      ...sourceAutomation,
      autoPostDueToday: false,
    })
  );

  // Capture current values for rollback.

  const previous = new Map<
    string,
    string | null
  >();

  for (const key of next.keys()) {
    previous.set(
      key,
      storage.getItem(key)
    );
  }

  // Attempt restore.

  try {
    for (const [key, value] of next) {
      writeVerified(
        storage,
        key,
        value
      );
    }
  } catch (cause) {
    const failures: string[] = [];

    // Best-effort rollback.

    for (const [key, value] of previous) {
      try {
        writeVerified(
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
        "Restore failed and rollback was incomplete (" +
        failures.join(", ") +
        "). Use your recovery download."
      );
    }

    throw new Error(
      "Restore failed; original storage values were restored. " +
      (
        cause instanceof Error
          ? cause.message
          : "Storage error"
      )
    );
  }
}
