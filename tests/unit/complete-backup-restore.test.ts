
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCompleteBackup,
  COMPLETE_BACKUP_KEYS,
} from "../../lib/complete-backup-validation";

import {
  restoreCompleteBackup,
} from "../../lib/complete-backup-restore";

// ==========================================
// SAMPLE BACKUP
// ==========================================

function exampleBackup() {
  const accounts = [
    {
      id: "cash",
      name: "Cash",
      type: "cash",
      currency: "NPR",
      openingBalancePaisa: 100000,
    },
  ];

  const categories = [
    {
      id: "food",
      name: "Food & Drinks",
      type: "expense",
    },
    {
      id: "salary",
      name: "Salary",
      type: "income",
    },
  ];

  const transactions = [
    {
      id: "purchase-1",
      type: "expense",
      accountId: "cash",
      categoryId: "food",
      amountPaisa: 500,
      occurredOn: "2026-11-10",
      note: "Snack",
    },
  ];

  const budgets = [
    {
      id: "food-budget",
      categoryId: "food",
      monthKey: "2026-11",
      limitPaisa: 20000,
    },
  ];

  return {
    application: "expense-tracker",
    format: "complete-workspace-backup",
    version: 1,
    exportedAt: "2026-11-15T05:00:00.000Z",

    data: {
      accounts,
      transactions,
      categories,
      budgets,
    },

    storage: {
      [COMPLETE_BACKUP_KEYS.accounts]:
        JSON.stringify(accounts),

      [COMPLETE_BACKUP_KEYS.transactions]:
        JSON.stringify(transactions),

      [COMPLETE_BACKUP_KEYS.customCategories]:
        JSON.stringify([]),

      [COMPLETE_BACKUP_KEYS.budgets]:
        JSON.stringify(budgets),
    },
  };
}

// ==========================================
// MOCK BROWSER STORAGE
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
      Array.from(this.values.keys())[index] ??
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
    if (key === this.failOnceOn) {
      this.failOnceOn = null;

      throw new Error(
        "Simulated quota error"
      );
    }

    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

// ==========================================
// RESTORE VALIDATION TESTS
// ==========================================

describe("complete backup restore safety", () => {
  it("accepts a valid complete backup", () => {
    const backup =
      validateCompleteBackup(
        exampleBackup()
      );

    expect(
      backup.data.budgets
    ).toHaveLength(1);
  });

  it("rejects orphaned transaction account IDs", () => {
    const invalid = exampleBackup();

    invalid.data.transactions[0].accountId =
      "deleted-account";

    expect(
      () => validateCompleteBackup(invalid)
    ).toThrow(/account or category/i);
  });

  it("rejects budgets that reference a non-expense category", () => {
    const invalid = exampleBackup();

    invalid.data.budgets[0].categoryId =
      "salary";

    expect(
      () => validateCompleteBackup(invalid)
    ).toThrow(/non-expense/i);
  });

  it("writes the four storage keys using validated live data", () => {
    const storage = new MemoryStorage();

    restoreCompleteBackup(
      exampleBackup(),
      storage
    );

    const transactions = JSON.parse(
      storage.getItem(
        COMPLETE_BACKUP_KEYS.transactions
      )!
    );

    expect(transactions).toHaveLength(1);

    expect(
      transactions[0].note
    ).toBe("Snack");
  });

  it("rolls back all keys if one write fails", () => {
    const storage = new MemoryStorage();

    const original =
      new Map<string, string>();

    for (
      const key of Object.values(
        COMPLETE_BACKUP_KEYS
      )
    ) {
      original.set(
        key,
        `["original:${key}"]`
      );

      storage.setItem(
        key,
        original.get(key)!
      );
    }

    storage.failOnceOn =
      COMPLETE_BACKUP_KEYS.budgets;

    expect(
      () =>
        restoreCompleteBackup(
          exampleBackup(),
          storage
        )
    ).toThrow(/rollback|restored/i);

    for (
      const key of Object.values(
        COMPLETE_BACKUP_KEYS
      )
    ) {
      expect(
        storage.getItem(key)
      ).toBe(
        original.get(key)
      );
    }
  });
});
