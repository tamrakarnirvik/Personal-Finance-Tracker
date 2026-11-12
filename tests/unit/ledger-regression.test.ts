
import { describe, expect, it } from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";

import {
  calculateAccountBalance,
  calculateTotals,
} from "../../lib/finance";

import { auditFinanceData } from "../../lib/finance-integrity";

const accounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 100000,
  },
  {
    id: "bank",
    name: "Bank Account",
    type: "bank",
    currency: "NPR",
    openingBalancePaisa: 200000,
  },
];

const categories: FinanceCategory[] = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "food", name: "Food & Drinks", type: "expense" },
];

const entries: FinanceTransaction[] = [
  {
    id: "salary-1",
    type: "income",
    accountId: "cash",
    categoryId: "salary",
    amountPaisa: 50000,
    occurredOn: "2026-11-03",
  },
  {
    id: "expense-1",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 15000,
    occurredOn: "2026-11-04",
  },
];

const transfer: FinanceTransaction = {
  id: "transfer-1",
  type: "transfer",
  fromAccountId: "cash",
  toAccountId: "bank",
  amountPaisa: 20000,
  occurredOn: "2026-11-05",
};

function totalBalance(transactions: FinanceTransaction[]) {
  return accounts.reduce(
    (sum, account) =>
      sum + calculateAccountBalance(account, transactions),
    0
  );
}

describe("Ledger regression tests", () => {
  it("preserves the combined balance after a transfer", () => {
    const before = totalBalance(entries);
    const after = totalBalance([...entries, transfer]);

    expect(before).toBe(335000);
    expect(after).toBe(before);

    expect(
      calculateAccountBalance(
        accounts[0],
        [...entries, transfer]
      )
    ).toBe(115000);

    expect(
      calculateAccountBalance(
        accounts[1],
        [...entries, transfer]
      )
    ).toBe(220000);
  });

  it("does not treat transfers as income or expenses", () => {
    const before = calculateTotals(entries);
    const after = calculateTotals([...entries, transfer]);

    expect(after.incomePaisa).toBe(before.incomePaisa);
    expect(after.expensePaisa).toBe(before.expensePaisa);

    expect(after.incomePaisa).toBe(50000);
    expect(after.expensePaisa).toBe(15000);
    expect(after.netPaisa).toBe(35000);
  });

  it("flags a negative closing balance for review", () => {
    const overspending: FinanceTransaction = {
      id: "overspending",
      type: "expense",
      accountId: "cash",
      categoryId: "food",
      amountPaisa: 200000,
      occurredOn: "2026-11-06",
    };

    const issues = auditFinanceData(
      accounts,
      [...entries, overspending],
      categories
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "negative-balance-cash",
          severity: "warning",
        }),
      ])
    );
  });
});
