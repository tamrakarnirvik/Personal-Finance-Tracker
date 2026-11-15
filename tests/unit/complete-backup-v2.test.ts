
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCompleteBackupV2,
  restoreSupportedCompleteBackup,
  validateSupportedCompleteBackup,
} from "../../lib/complete-backup-v2";

import {
  COMPLETE_BACKUP_KEYS,
} from "../../lib/complete-backup-validation";

import {
  RECURRING_STORAGE_KEY,
} from "../../lib/recurring-planning";

const account = {
  id: "cash",
  name: "Cash",
  type: "cash" as const,
  currency: "NPR" as const,
  openingBalancePaisa: 100000,
};

const category = {
  id: "food",
  name: "Food",
  type: "expense" as const,
};

const recurring = {
  id: "monthly-food",
  name: "Food budget",
  type: "expense" as const,
  accountId: "cash",
  categoryId: "food",
  amountPaisa: 10000,
  startOn: "2026-11-05",
  note: "",
  active: true,
};

function example() {
  return createCompleteBackupV2(
    {
      accounts: [account],
      transactions: [],
      categories: [category],
      customCategories: [],
    },
    {
      budgets: [],
      recurring: [
        { ...recurring },
      ],
    }
  );
}

// ==========================================
// MOCK LOCAL STORAGE
// ==========================================

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  failOnceOn: string | null = null;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  key(index: number) {
    return (
      [...this.values.keys()][index] ??
      null
    );
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(
    key: string,
    value: string
  ) {
    if (this.failOnceOn === key) {
      this.failOnceOn = null;

      throw new Error(
        "Simulated storage failure"
      );
    }

    this.values.set(
      key,
      value
    );
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

// ==========================================
// TESTS
// ==========================================

describe(
  "complete backup version 2",
  () => {
    it(
      "exports recurring schedules together with finance data",
      () => {
        const result =
          validateSupportedCompleteBackup(
            example()
          );

        expect(result.version).toBe(2);

        if (result.version !== 2) {
          throw new Error(
            "Expected V2"
          );
        }

        expect(
          result.data.recurring
        ).toHaveLength(1);

        expect(
          result.storage[
            RECURRING_STORAGE_KEY
          ]
        ).toContain(
          "monthly-food"
        );
      }
    );

    it(
      "rejects recurring schedules referencing missing accounts",
      () => {
        const backup = example();

        backup.data.recurring[0].accountId =
          "missing";

        backup.storage[
          RECURRING_STORAGE_KEY
        ] = JSON.stringify(
          backup.data.recurring
        );

        expect(
          () =>
            validateSupportedCompleteBackup(
              backup
            )
        ).toThrow(
          /missing account/i
        );
      }
    );

    it(
      "restores all five storage keys",
      () => {
        const storage =
          new MemoryStorage();

        restoreSupportedCompleteBackup(
          example(),
          storage
        );

        expect(
          storage.getItem(
            COMPLETE_BACKUP_KEYS.accounts
          )
        ).toContain(
          "cash"
        );

        expect(
          storage.getItem(
            RECURRING_STORAGE_KEY
          )
        ).toContain(
          "monthly-food"
        );
      }
    );

    it(
      "rolls back all five keys after a failed write",
      () => {
        const storage =
          new MemoryStorage();

        const keys = [
          ...Object.values(
            COMPLETE_BACKUP_KEYS
          ),
          RECURRING_STORAGE_KEY,
        ];

        for (const key of keys) {
          storage.setItem(
            key,
            JSON.stringify([
              `original-${key}`,
            ])
          );
        }

        storage.failOnceOn =
          RECURRING_STORAGE_KEY;

        expect(
          () =>
            restoreSupportedCompleteBackup(
              example(),
              storage
            )
        ).toThrow(
          /restored/i
        );

        for (const key of keys) {
          expect(
            storage.getItem(key)
          ).toBe(
            JSON.stringify([
              `original-${key}`,
            ])
          );
        }
      }
    );
  }
);
