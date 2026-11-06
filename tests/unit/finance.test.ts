
import { describe, expect, it } from "vitest";

import {
  parseNprToPaisa,
  formatNpr,
  calculateTotals,
  calculateAccountBalance,
} from "../../lib/finance";

import type {
  FinanceAccount,
  FinanceTransaction,
} from "../../types/finance";

const cashAccount: FinanceAccount = {
  id: "cash",
  name: "Cash Wallet",
  type: "cash",
  currency: "NPR",
  openingBalancePaisa: 100000,
};

const bankAccount: FinanceAccount = {
  id: "bank",
  name: "Bank Account",
  type: "bank",
  currency: "NPR",
  openingBalancePaisa: 0,
};

const transactions: FinanceTransaction[] = [
  {
    id: "1",
    type: "income",
    amountPaisa: 500000,
    accountId: "cash",
    categoryId: "salary",
    occurredOn: "2026-11-01",
  },
  {
    id: "2",
    type: "expense",
    amountPaisa: 17550,
    accountId: "cash",
    categoryId: "food",
    occurredOn: "2026-11-02",
  },
  {
    id: "3",
    type: "transfer",
    amountPaisa: 200000,
    fromAccountId: "cash",
    toAccountId: "bank",
    occurredOn: "2026-11-03",
  },
];

describe("Money calculations", () => {
  it("converts rupees into paisa", () => {
    expect(parseNprToPaisa("1250.50")).toBe(125050);
    expect(parseNprToPaisa("100")).toBe(10000);
  });

  it("rejects invalid amounts", () => {
    expect(() => parseNprToPaisa("10.123")).toThrow();
    expect(() => parseNprToPaisa("-50")).toThrow();
    expect(() => parseNprToPaisa("0")).toThrow();
  });

  it("formats NPR amounts", () => {
    expect(formatNpr(125050)).toBe("Rs. 1,250.50");
  });

  it("calculates income and expenses separately", () => {
    const totals = calculateTotals(transactions);

    expect(totals.incomePaisa).toBe(500000);
    expect(totals.expensePaisa).toBe(17550);
    expect(totals.netPaisa).toBe(482450);
  });

  it("deducts money from the source account", () => {
    expect(
      calculateAccountBalance(cashAccount, transactions)
    ).toBe(382450);
  });

  it("credits transferred money to destination account", () => {
    expect(
      calculateAccountBalance(bankAccount, transactions)
    ).toBe(200000);
  });
});
