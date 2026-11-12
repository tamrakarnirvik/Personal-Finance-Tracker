
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../types/finance";

import { calculateAccountBalance } from "./finance";

type TransferTransaction = Extract<
  FinanceTransaction,
  { type: "transfer" }
>;

export type TransferInput = Pick<
  TransferTransaction,
  | "fromAccountId"
  | "toAccountId"
  | "amountPaisa"
  | "occurredOn"
>;

export interface FinanceIssue {
  id: string;
  severity: "error" | "warning";
  message: string;
}

// Validate real calendar dates, not just their format.
export function isValidTransactionDate(
  value: string
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function assertTransactionDate(value: string) {
  if (!isValidTransactionDate(value)) {
    throw new Error(
      "Please enter a valid transaction date."
    );
  }
}

// All transaction amounts must be positive integer paisa.
export function assertPositiveAmountPaisa(
  amount: number
) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(
      "Amount must be greater than zero and use valid paisa."
    );
  }
}

// Return the signed movement for one account.

function accountMovement(
  accountId: string,
  transaction: FinanceTransaction
): number {
  // Handle transfers first.
  // Only transfers have fromAccountId and toAccountId.
  if (transaction.type === "transfer") {
    let movement = 0;

    if (transaction.fromAccountId === accountId) {
      movement -= transaction.amountPaisa;
    }

    if (transaction.toAccountId === accountId) {
      movement += transaction.amountPaisa;
    }

    return movement;
  }

  // Income and expenses use accountId.
  if (transaction.accountId !== accountId) {
    return 0;
  }

  // Income increases the account balance.
  if (transaction.type === "income") {
    return transaction.amountPaisa;
  }

  // Expenses decrease the account balance.
  return -transaction.amountPaisa;
}


// Validate a proposed transfer before saving it.
export function assertTransferAllowed(
  accounts: FinanceAccount[],
  transactions: FinanceTransaction[],
  draft: TransferInput
) {
  assertPositiveAmountPaisa(draft.amountPaisa);
  assertTransactionDate(draft.occurredOn);

  if (draft.fromAccountId === draft.toAccountId) {
    throw new Error(
      "Choose two different accounts."
    );
  }

  const source = accounts.find(
    (account) => account.id === draft.fromAccountId
  );

  const destination = accounts.find(
    (account) => account.id === draft.toAccountId
  );

  if (!source || !destination) {
    throw new Error(
      "Select valid source and destination accounts."
    );
  }

  // Include the proposed transfer in the account ledger.
  const proposed: TransferTransaction = {
    id: "__proposed_transfer__",
    type: "transfer",
    ...draft,
  };

  // Group all account movements by date.
  const dailyMovements = new Map<string, number>();

  for (const transaction of [
    ...transactions,
    proposed,
  ]) {
    const movement = accountMovement(
      source.id,
      transaction
    );

    if (movement === 0) continue;

    dailyMovements.set(
      transaction.occurredOn,
      (dailyMovements.get(transaction.occurredOn) ?? 0) +
        movement
    );
  }

  let balance = source.openingBalancePaisa;

  const dates = [...dailyMovements.keys()].sort();

  for (const date of dates) {
    balance += dailyMovements.get(date) ?? 0;

    // Check the transfer date and every subsequent date.
    if (date >= draft.occurredOn && balance < 0) {
      throw new Error(
        `Insufficient funds in ${source.name}. ` +
        `This transfer would create a negative ` +
        `balance on ${date}.`
      );
    }
  }
}

// Review saved records without changing them.
export function auditFinanceData(
  accounts: FinanceAccount[],
  transactions: FinanceTransaction[],
  categories: FinanceCategory[]
): FinanceIssue[] {
  const issues: FinanceIssue[] = [];

  const accountIds = new Set(
    accounts.map((account) => account.id)
  );

  const categoryById = new Map(
    categories.map((category) => [
      category.id,
      category,
    ])
  );

  const transactionIds = new Set<string>();
  const seenAccountIds = new Set<string>();

  for (const account of accounts) {
    if (seenAccountIds.has(account.id)) {
      issues.push({
        id: `duplicate-account-${account.id}`,
        severity: "error",
        message: `Duplicate account ID: ${account.id}`,
      });
    }

    seenAccountIds.add(account.id);
  }

  transactions.forEach((transaction, index) => {
    const prefix = `transaction-${index}`;

    if (transactionIds.has(transaction.id)) {
      issues.push({
        id: `${prefix}-duplicate`,
        severity: "error",
        message:
          `Duplicate transaction ID: ${transaction.id}`,
      });
    }

    transactionIds.add(transaction.id);

    if (
      !Number.isSafeInteger(transaction.amountPaisa) ||
      transaction.amountPaisa <= 0
    ) {
      issues.push({
        id: `${prefix}-amount`,
        severity: "error",
        message:
          `Transaction ${transaction.id} has an invalid amount.`,
      });
    }

    if (!isValidTransactionDate(transaction.occurredOn)) {
      issues.push({
        id: `${prefix}-date`,
        severity: "error",
        message:
          `Transaction ${transaction.id} has an invalid date.`,
      });
    }

    if (transaction.type === "transfer") {
      if (
        !accountIds.has(transaction.fromAccountId) ||
        !accountIds.has(transaction.toAccountId) ||
        transaction.fromAccountId ===
          transaction.toAccountId
      ) {
        issues.push({
          id: `${prefix}-account`,
          severity: "error",
          message:
            `Transfer ${transaction.id} has invalid accounts.`,
        });
      }

      return;
    }

    if (!accountIds.has(transaction.accountId)) {
      issues.push({
        id: `${prefix}-account`,
        severity: "error",
        message:
          `Transaction ${transaction.id} references a missing account.`,
      });
    }

    const category = categoryById.get(
      transaction.categoryId
    );

    if (!category || category.type !== transaction.type) {
      issues.push({
        id: `${prefix}-category`,
        severity: "error",
        message:
          `Transaction ${transaction.id} references a missing or mismatched category.`,
      });
    }
  });

  for (const account of accounts) {
    const balance = calculateAccountBalance(
      account,
      transactions
    );

    if (balance < 0) {
      issues.push({
        id: `negative-balance-${account.id}`,
        severity: "warning",
        message:
          `${account.name} has a negative balance. ` +
          `Review its transactions and opening balance.`,
      });
    }
  }

  return issues;
}
