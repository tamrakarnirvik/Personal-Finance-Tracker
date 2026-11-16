
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  COMPLETE_BACKUP_KEYS,
} from "../../lib/complete-backup-validation";

import {
  RECURRING_STORAGE_KEY,
} from "../../lib/recurring-planning";

import {
  RECURRING_AUTOMATION_KEY,
} from "../../lib/recurring-automation";

import {
  createCompleteBackupV3,
  restoreAnyCompleteBackup,
  validateAnyCompleteBackup,
} from "../../lib/complete-backup-v3";

import {
  createCompleteBackupV2,
} from "../../lib/complete-backup-v2";

// ==========================================
// MOCK STORAGE
// ==========================================

class MemoryStorage implements Storage {
  private data =
    new Map<string, string>();

  failOnceOn: string | null = null;

  get length() {
    return this.data.size;
  }

  key(index: number) {
    return (
      Array.from(
        this.data.keys()
      )[index] ?? null
    );
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(
    key: string,
    value: string
  ) {
    if (
      key === this.failOnceOn
    ) {
      this.failOnceOn = null;

      throw new Error(
        "Simulated quota failure"
      );
    }

    this.data.set(
      key,
      value
    );
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

// ==========================================
// TEST RECORDS
// ==========================================

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
  id: "rent-1",
  name: "Rent",
  type: "expense" as const,
  accountId: "cash",
  categoryId: "food",
  amountPaisa: 1000,
  startOn: "2026-11-01",
  frequency: "monthly" as const,
  note: "",
  active: true,
};

const records = {
  accounts: [account],
  transactions: [],
  categories: [category],
  customCategories: [],
};

const extras = {
  budgets: [],
  recurring: [recurring],
};

const prefs = {
  autoPostDueToday: true,
  showDashboardWidget: false,
  reminderDaysAhead: 30 as const,
};

// ==========================================
// EXAMPLE BACKUP
// ==========================================

function example() {
  const storage =
    new MemoryStorage();

  storage.setItem(
    RECURRING_STORAGE_KEY,
    JSON.stringify(
      extras.recurring
    )
  );

  storage.setItem(
    RECURRING_AUTOMATION_KEY,
    JSON.stringify(prefs)
  );

  return createCompleteBackupV3(
    records,
    storage
  );
}

// ==========================================
// TESTS
// ==========================================

describe("complete backup v3", () => {
  it(
    "exports automation preferences with recurring and financial data",
    () => {
      const backup =
        validateAnyCompleteBackup(
          example()
        );

      expect(
        backup.version
      ).toBe(3);

      if (backup.version !== 3) {
        throw new Error(
          "Expected V3"
        );
      }

      expect(
        backup.data.recurring
      ).toHaveLength(1);

      expect(
        backup.data.automation
      ).toEqual(prefs);
    }
  );

  it(
    "rejects a tampered automation snapshot",
    () => {
      const backup = example();

      backup.storage[
        RECURRING_AUTOMATION_KEY
      ] = JSON.stringify({
        ...prefs,
        autoPostDueToday: false,
      });

      expect(
        () =>
          validateAnyCompleteBackup(
            backup
          )
      ).toThrow(/snapshot/i);
    }
  );

  it(
    "restores financial data and disables auto-posting",
    () => {
      const storage =
        new MemoryStorage();

      restoreAnyCompleteBackup(
        example(),
        storage
      );

      expect(
        storage.getItem(
          COMPLETE_BACKUP_KEYS.accounts
        )
      ).toContain("cash");

      expect(
        storage.getItem(
          RECURRING_STORAGE_KEY
        )
      ).toContain("rent-1");

      const saved = JSON.parse(
        storage.getItem(
          RECURRING_AUTOMATION_KEY
        )!
      );

      expect(
        saved.autoPostDueToday
      ).toBe(false);

      expect(
        saved.reminderDaysAhead
      ).toBe(30);

      expect(
        saved.showDashboardWidget
      ).toBe(false);
    }
  );

  it(
    "restores a legacy V2 backup and preserves reminder preferences safely",
    () => {
      const storage =
        new MemoryStorage();

      storage.setItem(
        RECURRING_AUTOMATION_KEY,
        JSON.stringify(prefs)
      );

      restoreAnyCompleteBackup(
        createCompleteBackupV2(
          records,
          extras
        ),
        storage
      );

      const saved = JSON.parse(
        storage.getItem(
          RECURRING_AUTOMATION_KEY
        )!
      );

      expect(
        saved.autoPostDueToday
      ).toBe(false);

      expect(
        saved.reminderDaysAhead
      ).toBe(30);
    }
  );

  it(
    "blocks V1 restore when saved schedules exist",
    () => {
      const storage =
        new MemoryStorage();

      storage.setItem(
        RECURRING_STORAGE_KEY,
        JSON.stringify(
          extras.recurring
        )
      );

      const v2 =
        createCompleteBackupV2(
          records,
          extras
        );

      const v1 = {
        ...v2,
        version: 1,

        data: {
          accounts: v2.data.accounts,
          transactions: v2.data.transactions,
          categories: v2.data.categories,
          budgets: v2.data.budgets,
        },
      };

      expect(
        () =>
          restoreAnyCompleteBackup(
            v1,
            storage
          )
      ).toThrow(/V1 backups/i);
    }
  );

  it(
    "rolls back all six storage keys after a failed write",
    () => {
      const storage =
        new MemoryStorage();

      const keys = [
        ...Object.values(
          COMPLETE_BACKUP_KEYS
        ),
        RECURRING_STORAGE_KEY,
        RECURRING_AUTOMATION_KEY,
      ];

      for (const key of keys) {
        storage.setItem(
          key,
          key === RECURRING_AUTOMATION_KEY
            ? JSON.stringify(prefs)
            : "[]"
        );
      }

      const before =
        keys.map(
          (key) =>
            storage.getItem(key)
        );

      storage.failOnceOn =
        RECURRING_AUTOMATION_KEY;

      expect(
        () =>
          restoreAnyCompleteBackup(
            example(),
            storage
          )
      ).toThrow(/restored/i);

      expect(
        keys.map(
          (key) =>
            storage.getItem(key)
        )
      ).toEqual(before);
    }
  );

  it(
    "blocks export when current automation preferences are corrupted",
    () => {
      const storage =
        new MemoryStorage();

      storage.setItem(
        RECURRING_AUTOMATION_KEY,
        "{not-json"
      );

      expect(
        () =>
          createCompleteBackupV3(
            records,
            storage
          )
      ).toThrow(/unreadable/i);
    }
  );
});
