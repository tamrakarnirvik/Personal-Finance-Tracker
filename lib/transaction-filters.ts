
import type {
  FinanceAccount,
  FinanceTransaction,
} from "@/types/finance";

import { getCategoryName } from "@/lib/transaction-categories";

export type TransactionTypeFilter =
  | "all"
  | "income"
  | "expense"
  | "transfer";

export type TransactionSort =
  | "newest"
  | "oldest"
  | "highest"
  | "lowest";

export interface TransactionFilters {
  search: string;
  type: TransactionTypeFilter;
  categoryId: string;
  accountId: string;
  fromDate: string;
  toDate: string;
  minAmountPaisa: number | null;
  maxAmountPaisa: number | null;
  sort: TransactionSort;
}

export function filterTransactions(
  transactions: FinanceTransaction[],
  accounts: FinanceAccount[],
  filters: TransactionFilters
): FinanceTransaction[] {
  const accountNames = new Map(
    accounts.map((account) => [
      account.id,
      account.name,
    ])
  );

  const query = filters.search.trim().toLowerCase();

  const filtered = transactions.filter((transaction) => {
    // 1. Transaction type
    if (
      filters.type !== "all" &&
      transaction.type !== filters.type
    ) {
      return false;
    }

    // 2. Date range
    if (
      filters.fromDate &&
      transaction.occurredOn < filters.fromDate
    ) {
      return false;
    }

    if (
      filters.toDate &&
      transaction.occurredOn > filters.toDate
    ) {
      return false;
    }

    // 3. Amount range
    if (
      filters.minAmountPaisa !== null &&
      transaction.amountPaisa < filters.minAmountPaisa
    ) {
      return false;
    }

    if (
      filters.maxAmountPaisa !== null &&
      transaction.amountPaisa > filters.maxAmountPaisa
    ) {
      return false;
    }

    // 4. Category
    if (filters.categoryId) {
      if (
        transaction.type === "transfer" ||
        transaction.categoryId !== filters.categoryId
      ) {
        return false;
      }
    }

    // 5. Account
    if (filters.accountId) {
      const matchesAccount =
        transaction.type === "transfer"
          ? transaction.fromAccountId === filters.accountId ||
            transaction.toAccountId === filters.accountId
          : transaction.accountId === filters.accountId;

      if (!matchesAccount) {
        return false;
      }
    }

    // 6. Text search
    if (query) {
      const searchable =
        transaction.type === "transfer"
          ? [
              transaction.note,
              "transfer",
              accountNames.get(transaction.fromAccountId),
              accountNames.get(transaction.toAccountId),
            ]
          : [
              transaction.note,
              transaction.type,
              getCategoryName(transaction.categoryId),
              accountNames.get(transaction.accountId),
            ];

      const text = searchable
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!text.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Sort a new array without changing the original state.
  return filtered.sort((a, b) => {
    if (filters.sort === "highest") {
      return (
        b.amountPaisa - a.amountPaisa ||
        b.occurredOn.localeCompare(a.occurredOn)
      );
    }

    if (filters.sort === "lowest") {
      return (
        a.amountPaisa - b.amountPaisa ||
        b.occurredOn.localeCompare(a.occurredOn)
      );
    }

    if (filters.sort === "oldest") {
      return (
        a.occurredOn.localeCompare(b.occurredOn) ||
        a.id.localeCompare(b.id)
      );
    }

    return (
      b.occurredOn.localeCompare(a.occurredOn) ||
      b.id.localeCompare(a.id)
    );
  });
}
