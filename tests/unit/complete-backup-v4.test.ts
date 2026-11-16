
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCompleteBackupV4,
  restoreBackupWithGoals,
  validateBackupWithGoals,
} from "../../lib/complete-backup-v4";

import {
  GOALS_STORAGE_KEY,
} from "../../lib/goal-planning";

import {
  RECURRING_AUTOMATION_KEY,
} from "../../lib/recurring-automation";

import {
  COMPLETE_BACKUP_KEYS,
} from "../../lib/complete-backup-validation";

// ======================================
// MOCK BROWSER STORAGE
// ======================================

class MemoryStorage implements Storage {
  private records =
    new Map<string, string>();

  failOnceOn: string | null = null;

  get length() {
    return this.records.size;
  }

  key(index: number) {
    return (
      [...this.records.keys()][index] ??
      null
    );
  }

  getItem(key: string) {
    return this.records.get(key) ?? null;
  }

  setItem(
    key: string,
    value: string
  ) {
    if (
      this.failOnceOn === key
    ) {
      this.failOnceOn = null;

      throw new Error(
        "Simulated write failure"
      );
    }

    this.records.set(
      key,
      value
    );
  }

  removeItem(key: string) {
    this.records.delete(key);
  }

  clear() {
    this.records.clear();
  }
}

// ======================================
// CREATE TEST BACKUP
// ======================================

function example() {
  const storage =
    new MemoryStorage();

  const goals = {
    version: 1,

    goals: [
      {
        id: "goal-1",
        name: "Laptop",
        targetPaisa: 1000000,
        openingPaisa: 200000,
        createdOn: "2026-11-16",
        deadlineOn: null,
      },
    ],

    movements: [],
  };

  storage.setItem(
    GOALS_STORAGE_KEY,
    JSON.stringify(goals)
  );

  storage.setItem(
    RECURRING_AUTOMATION_KEY,
    JSON.stringify({
      autoPostDueToday: true,
      showDashboardWidget: true,
      reminderDaysAhead: 14,
    })
  );

  return createCompleteBackupV4(
    {
      accounts: [
        {
          id: "cash",
          name: "Cash",
          type: "cash",
          currency: "NPR",
          openingBalancePaisa: 0,
        },
      ],

      transactions: [],

      categories: [
        {
          id: "food",
          name: "Food",
          type: "expense",
        },
      ],

      customCategories: [],
    },

    storage
  );
}

// ======================================
// BACKUP TESTS
// ======================================

describe("complete backup v4", () => {
  it("includes goals and automation preferences", () => {
    const backup =
      validateBackupWithGoals(
        example()
      );

    expect(
      backup.version
    ).toBe(4);

    if (backup.version === 4) {
      expect(
        backup.data.goals.goals
      ).toHaveLength(1);
    }
  });

  it("rejects goal snapshot tampering", () => {
    const backup = example();

    backup.storage[
      GOALS_STORAGE_KEY
    ] = JSON.stringify({
      version: 1,
      goals: [],
      movements: [],
    });

    expect(() =>
      validateBackupWithGoals(
        backup
      )
    ).toThrow(
      /goal storage snapshot/i
    );
  });

  it("restores goals and disables automatic posting", () => {
    const storage =
      new MemoryStorage();

    restoreBackupWithGoals(
      example(),
      storage
    );

    expect(
      storage.getItem(
        GOALS_STORAGE_KEY
      )
    ).toContain("Laptop");

    const settings = JSON.parse(
      storage.getItem(
        RECURRING_AUTOMATION_KEY
      )!
    );

    expect(
      settings.autoPostDueToday
    ).toBe(false);
  });

  it("rolls back on a failed write", () => {
    const storage =
      new MemoryStorage();

    storage.setItem(
      COMPLETE_BACKUP_KEYS.accounts,
      "original accounts"
    );

    storage.failOnceOn =
      GOALS_STORAGE_KEY;

    expect(() =>
      restoreBackupWithGoals(
        example(),
        storage
      )
    ).toThrow(/restored/i);

    expect(
      storage.getItem(
        COMPLETE_BACKUP_KEYS.accounts
      )
    ).toBe(
      "original accounts"
    );
  });

  it("blocks legacy restore when goals already exist", () => {
    const storage =
      new MemoryStorage();

    const old = example();

    storage.setItem(
      GOALS_STORAGE_KEY,
      JSON.stringify(
        old.data.goals
      )
    );

    const v3 = {
      ...old,
      version: 3,

      data: {
        accounts:
          old.data.accounts,
        transactions:
          old.data.transactions,
        categories:
          old.data.categories,
        budgets:
          old.data.budgets,
        recurring:
          old.data.recurring,
        automation:
          old.data.automation,
      },
    };

    expect(() =>
      restoreBackupWithGoals(
        v3,
        storage
      )
    ).toThrow(/older backup/i);
  });
});
