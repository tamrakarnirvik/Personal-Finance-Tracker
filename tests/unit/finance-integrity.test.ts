
import { describe, expect, it } from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";

import {
  assertPositiveAmountPaisa,
  assertTransactionDate,
  assertTransferAllowed,
  auditFinanceData,
  isValidTransactionDate,
} from "../../lib/finance-integrity";

const accounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 10000,
  },
  {
    id: "bank",
    name: "Bank Account",
    type: "bank",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
];

const categories: FinanceCategory[] = [
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

const validTransfer = {
  fromAccountId: "cash",
  toAccountId: "bank",
  amountPaisa: 1000,
  occurredOn: "2026-11-09",
};

describe("Finance integrity", () => {
  it("accepts a real calendar date", () => {
    expect(isValidTransactionDate("2024-02-29"))
      .toBe(true);
  });

  it("rejects an impossible date", () => {
    expect(isValidTransactionDate("2026-02-29"))
      .toBe(false);

    expect(() =>
      assertTransactionDate("2026-02-30")
    ).toThrow();
  });

  it("rejects zero and fractional paisa amounts", () => {
    expect(() => assertPositiveAmountPaisa(0))
      .toThrow();

    expect(() => assertPositiveAmountPaisa(100.5))
      .toThrow();

    expect(() => assertPositiveAmountPaisa(100))
      .not.toThrow();
  });

  it("allows a transfer with sufficient funds", () => {
    expect(() =>
      assertTransferAllowed(
        accounts,
        [],
        validTransfer
      )
    ).not.toThrow();
  });

  it("rejects a transfer to the same account", () => {
    expect(() =>
      assertTransferAllowed(accounts, [], {
        ...validTransfer,
        toAccountId: "cash",
      })
    ).toThrow("different accounts");
  });

  it("rejects a transfer larger than available funds", () => {
    expect(() =>
      assertTransferAllowed(accounts, [], {
        ...validTransfer,
        amountPaisa: 11000,
      })
    ).toThrow("Insufficient funds");
  });

  it("rejects a transfer that would break a future balance", () => {
    const futureExpense: FinanceTransaction = {
      id: "expense-1",
      type: "expense",
      accountId: "cash",
      categoryId: "food",
      amountPaisa: 8000,
      occurredOn: "2026-11-10",
    };

    expect(() =>
      assertTransferAllowed(
        accounts,
        [futureExpense],
        {
          ...validTransfer,
          amountPaisa: 3000,
        }
      )
    ).toThrow("negative balance");

    expect(() =>
      assertTransferAllowed(
        accounts,
        [futureExpense],
        validTransfer
      )
    ).not.toThrow();
  });

  it("detects broken transaction references", () => {
    const invalid: FinanceTransaction = {
      id: "invalid-1",
      type: "expense",
      accountId: "missing-account",
      categoryId: "missing-category",
      amountPaisa: 100,
      occurredOn: "2026-02-30",
    };

    const issues = auditFinanceData(
      accounts,
      [invalid],
      categories
    );

    expect(
      issues.some((issue) =>
        issue.message.includes("missing account")
      )
    ).toBe(true);

    expect(
      issues.some((issue) =>
        issue.message.includes("mismatched category")
      )
    ).toBe(true);

    expect(
      issues.some((issue) =>
        issue.message.includes("invalid date")
      )
    ).toBe(true);
  });
});
