
import {
  COMPLETE_BACKUP_KEYS,
  validateCompleteBackup,
  type CompleteBackupData,
  type CompleteBackupStorage,
  type CompleteBackupStorageKey,
} from "./complete-backup-validation";

const KEY_ORDER = [
  COMPLETE_BACKUP_KEYS.accounts,
  COMPLETE_BACKUP_KEYS.transactions,
  COMPLETE_BACKUP_KEYS.customCategories,
  COMPLETE_BACKUP_KEYS.budgets,
] as const;

// ==========================================
// BUILD THE VALUES TO RESTORE
// ==========================================

export function buildRestoreValues(
  backup: CompleteBackupData
): CompleteBackupStorage {
  return {
    [COMPLETE_BACKUP_KEYS.accounts]:
      JSON.stringify(backup.data.accounts),

    [COMPLETE_BACKUP_KEYS.transactions]:
      JSON.stringify(backup.data.transactions),

    // Built-in categories are supplied by the app.
    // Only user-created categories are stored.

    [COMPLETE_BACKUP_KEYS.customCategories]:
      backup.storage[
        COMPLETE_BACKUP_KEYS.customCategories
      ],

    [COMPLETE_BACKUP_KEYS.budgets]:
      JSON.stringify(backup.data.budgets),
  };
}

// ==========================================
// WRITE AND VERIFY ONE STORAGE VALUE
// ==========================================

function writeValue(
  storage: Storage,
  key: CompleteBackupStorageKey,
  value: string | null
) {
  if (value === null) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, value);
  }

  if (storage.getItem(key) !== value) {
    throw new Error(
      `Could not verify the stored value for ${key}.`
    );
  }
}

// ==========================================
// RESTORE COMPLETE BACKUP
// ==========================================

export function restoreCompleteBackup(
  input: unknown,
  storage: Storage
): void {
  // Validate before changing any data.

  const backup = validateCompleteBackup(input);

  const next = buildRestoreValues(backup);

  const previous =
    {} as CompleteBackupStorage;

  // Capture all original values first.

  for (const key of KEY_ORDER) {
    previous[key] = storage.getItem(key);
  }

  try {
    // Restore financial data.

    for (const key of KEY_ORDER) {
      writeValue(
        storage,
        key,
        next[key]
      );
    }
  } catch (error) {
    // Attempt to restore the original values
    // if any operation fails.

    const recoveryFailures: string[] = [];

    for (const key of KEY_ORDER) {
      try {
        writeValue(
          storage,
          key,
          previous[key]
        );
      } catch {
        recoveryFailures.push(key);
      }
    }

    if (recoveryFailures.length > 0) {
      throw new Error(
        `Restore failed and automatic rollback was incomplete for: ${recoveryFailures.join(", ")}. ` +
        "Keep the recovery JSON download; do not close the browser until you have checked your data."
      );
    }

    throw new Error(
      `Restore failed. Original browser values were restored. ${
        error instanceof Error
          ? error.message
          : "Storage write failed."
      }`
    );
  }
}
