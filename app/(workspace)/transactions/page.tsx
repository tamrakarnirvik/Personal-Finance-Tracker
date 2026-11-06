
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

import { formatNpr } from "@/lib/finance";
import { getCategoryName } from "@/lib/transaction-categories";

import {
  useTransactions,
  type EntryTransaction,
} from "@/components/transactions/transaction-provider";

import { TransactionDialog } from "@/components/transactions/transaction-dialog";

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const { transactions, deleteEntry, accounts } = useTransactions();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const entries = transactions.filter(
    (transaction): transaction is EntryTransaction =>
      transaction.type !== "transfer"
  );

  const filteredEntries = entries
    .filter((transaction) => {
      const category = getCategoryName(
        transaction.categoryId
      );

      const matchesSearch = (
        `${transaction.note ?? ""} ${category}`
      )
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        filter === "all" || transaction.type === filter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) =>
      b.occurredOn.localeCompare(a.occurredOn)
    );

  function removeTransaction(
    transaction: EntryTransaction
  ) {
    const confirmed = window.confirm(
      `Delete this ${transaction.type} transaction?`
    );

    if (confirmed) {
      deleteEntry(transaction.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Transactions"
          description="Manage your income and expenses"
        />

        <TransactionDialog />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          {/* Search and filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <select
              aria-label="Filter transaction type"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as FilterType)
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="all">All Transactions</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>

          <p className="mb-4 text-xs text-slate-500">
            {filteredEntries.length} transaction(s) found
          </p>

          {/* Transaction records */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-medium">
                  No transactions found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add a transaction or adjust your filters.
                </p>
              </div>
            ) : (
              filteredEntries.map((transaction) => {
                const isIncome =
                  transaction.type === "income";

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {transaction.note ||
                          getCategoryName(transaction.categoryId)}
                      </p>

                      
<p className="mt-1 text-xs text-slate-500">
  {getCategoryName(transaction.categoryId)}
  {" · "}
  {transaction.occurredOn}
  {" · "}
  {accounts.find(
    (account) => account.id === transaction.accountId
  )?.name ?? "Unknown Account"}
</p>

                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p
                        className={`text-sm font-semibold ${
                          isIncome
                            ? "text-emerald-600"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {formatNpr(transaction.amountPaisa)}
                      </p>

                      <TransactionDialog
                        transaction={transaction}
                      />

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={`Delete transaction ${transaction.note || transaction.id}`}
                        onClick={() =>
                          removeTransaction(transaction)
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-amber-700 dark:text-amber-400">
        Prototype mode: changes are temporary and reset
        after a browser refresh.
      </p>
    </div>
  );
}
