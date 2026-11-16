
import { describe, expect, it } from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";

import type {
  RecurringSchedule,
} from "../../lib/recurring-planning";

import {
  analyzeDataHealth,
} from "../../lib/data-health";

import {
  EMPTY_GOAL_WORKSPACE,
} from "../../lib/goal-planning";

// ==========================================
// TEST ACCOUNTS
// ==========================================

const accounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
];

// ==========================================
// TEST CATEGORIES
// ==========================================

const categories: FinanceCategory[] = [
  {
    id: "food",
    name: "Food",
    type: "expense",
  },
  {
    id: "salary",
    name: "Salary",
    type: "income",
  },
];

// ==========================================
// SAMPLE EXPENSE TRANSACTION
// ==========================================

// Use "satisfies FinanceTransaction" instead
// of Extract<FinanceTransaction, {type: "expense"}>.
//
// This supports finance models that combine
// income and expense into one union member.

const sampleExpense = {
  id: "t1",
  type: "expense",
  accountId: "cash",
  categoryId: "food",
  amountPaisa: 12300,
  occurredOn: "2026-11-02",
  note: "Lunch",
} satisfies FinanceTransaction;

const transactions: FinanceTransaction[] = [
  sampleExpense,
];

// ==========================================
// VALID RECURRING SCHEDULE
// ==========================================

const validSchedule: RecurringSchedule = {
  id: "rent-1",
  name: "Rent",
  type: "expense",
  accountId: "cash",
  categoryId: "food",
  amountPaisa: 200000,
  startOn: "2026-11-01",
  note: "",
  active: true,
  frequency: "monthly",
};

// ==========================================
// DATA HEALTH TEST HELPER
// ==========================================

type HealthInput = Parameters<
  typeof analyzeDataHealth
>[0];

function run(
  overrides: Partial<HealthInput> = {}
) {
  return analyzeDataHealth({
    accounts,
    categories,
    transactions,
    goals: EMPTY_GOAL_WORKSPACE,
    schedules: [validSchedule],
    ...overrides,
  });
}

// ==========================================
// UNIT TESTS
// ==========================================

describe("Phase 15 data health checks", () => {

  // ----------------------------------------
  // TEST 1: VALID DATA
  // ----------------------------------------

  it("reports healthy data without changing it", () => {
    const before = JSON.stringify(
      transactions
    );

    const result = run();

    expect(result.status).toBe(
      "healthy"
    );

    expect(result.issues).toHaveLength(0);

    expect(
      JSON.stringify(transactions)
    ).toBe(before);
  });

  // ----------------------------------------
  // TEST 2: DUPLICATE TRANSACTIONS
  // ----------------------------------------

  it("detects duplicate transaction IDs", () => {
    const result = run({
      transactions: [
        sampleExpense,
        { ...sampleExpense },
      ],
    });

    expect(result.status).toBe(
      "attention"
    );

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "DUPLICATE_TRANSACTION_IDS"
      )
    ).toBe(true);
  });

  // ----------------------------------------
  // TEST 3: INVALID REFERENCES
  // ----------------------------------------

  it("detects missing accounts and category/type mismatches", () => {
    const brokenExpense = {
      ...sampleExpense,
      id: "broken-expense",
      accountId: "deleted-account",
      categoryId: "salary",
    } satisfies FinanceTransaction;

    const result = run({
      transactions: [brokenExpense],
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "MISSING_ACCOUNTS"
      )
    ).toBe(true);

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "CATEGORY_TYPE_MISMATCH"
      )
    ).toBe(true);
  });

  // ----------------------------------------
  // TEST 4: INVALID TRANSFER
  // ----------------------------------------

  it("detects a transfer between the same account", () => {
    const invalidTransfer = {
      id: "invalid-transfer",
      type: "transfer",
      fromAccountId: "cash",
      toAccountId: "cash",
      amountPaisa: 100,
      occurredOn: "2026-11-02",
      note: "Test same-account transfer",
    } satisfies FinanceTransaction;

    const result = run({
      transactions: [invalidTransfer],
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "INVALID_TRANSFERS"
      )
    ).toBe(true);
  });

  // ----------------------------------------
  // TEST 5: GOALS AND RECURRING
  // ----------------------------------------

  it("detects invalid goals and missing recurring references", () => {
    const result = run({
      goalsError: "Unreadable goals",

      schedules: [
        {
          ...validSchedule,
          accountId: "missing-account",
        },
      ],
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "INVALID_GOALS"
      )
    ).toBe(true);

    expect(
      result.issues.some(
        (issue) =>
          issue.code ===
          "RECURRING_REFERENCES"
      )
    ).toBe(true);
  });
});
