
import type {
  FinanceAccount,
  FinanceTransaction,
} from "../types/finance";

function validateAmount(amountPaisa: number) {
  if (
    !Number.isSafeInteger(amountPaisa) ||
    amountPaisa <= 0
  ) {
    throw new Error("Amount must be a positive integer in paisa.");
  }
}

// Convert user input: "1250.50" => 125050 paisa.
export function parseNprToPaisa(value: string): number {
  const input = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(input)) {
    throw new Error("Enter a valid NPR amount.");
  }

  const [rupees, fraction = ""] = input.split(".");
  const amount =
    Number(rupees) * 100 +
    Number(fraction.padEnd(2, "0") || "0");

  validateAmount(amount);
  return amount;
}

// Convert paisa to a formatted NPR amount.
export function formatNpr(amountPaisa: number): string {
  if (!Number.isSafeInteger(amountPaisa)) {
    throw new Error("Invalid money amount.");
  }

  const formatted = (Math.abs(amountPaisa) / 100)
    .toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return `${amountPaisa < 0 ? "-" : ""}Rs. ${formatted}`;
}

// Calculate income and expenses.
// Transfers do not affect either total.
export function calculateTotals(
  transactions: FinanceTransaction[]
) {
  let incomePaisa = 0;
  let expensePaisa = 0;

  for (const transaction of transactions) {
    validateAmount(transaction.amountPaisa);

    if (transaction.type === "income") {
      incomePaisa += transaction.amountPaisa;
    }

    if (transaction.type === "expense") {
      expensePaisa += transaction.amountPaisa;
    }
  }

  return {
    incomePaisa,
    expensePaisa,
    netPaisa: incomePaisa - expensePaisa,
  };
}

// Calculate a single account's balance.
export function calculateAccountBalance(
  account: FinanceAccount,
  transactions: FinanceTransaction[]
): number {
  let balance = account.openingBalancePaisa;

  if (!Number.isSafeInteger(balance)) {
    throw new Error("Invalid opening balance.");
  }

  for (const transaction of transactions) {
    validateAmount(transaction.amountPaisa);

    if (transaction.type === "transfer") {
      if (
        transaction.fromAccountId ===
        transaction.toAccountId
      ) {
        throw new Error(
          "A transfer must use different accounts."
        );
      }

      if (transaction.fromAccountId === account.id) {
        balance -= transaction.amountPaisa;
      }

      if (transaction.toAccountId === account.id) {
        balance += transaction.amountPaisa;
      }

      continue;
    }

    if (transaction.accountId !== account.id) {
      continue;
    }

    if (transaction.type === "income") {
      balance += transaction.amountPaisa;
    } else {
      balance -= transaction.amountPaisa;
    }
  }

  if (!Number.isSafeInteger(balance)) {
    throw new Error("Account balance exceeds safe limits.");
  }

  return balance;
}
