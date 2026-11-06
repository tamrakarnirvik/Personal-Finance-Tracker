
"use client";

import { Card, CardContent } from "@/components/ui/card";

import { formatNpr } from "@/lib/finance";
import { getCategoryName } from "@/lib/transaction-categories";

import {
  useTransactions,
  type EntryTransaction,
} from "@/components/transactions/transaction-provider";

export function RecentTransactions() {
  const { transactions } = useTransactions();

  const recent = transactions
    .filter(
      (transaction): transaction is EntryTransaction =>
        transaction.type !== "transfer"
    )
    .sort((a, b) =>
      b.occurredOn.localeCompare(a.occurredOn)
    )
    .slice(0, 5);

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <h3 className="mb-5 text-lg font-semibold">
          Recent Transactions
        </h3>

        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((transaction) => {
              const isIncome =
                transaction.type === "income";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {transaction.note ||
                        getCategoryName(transaction.categoryId)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {getCategoryName(transaction.categoryId)}
                      {" · "}
                      {transaction.occurredOn}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      isIncome
                        ? "text-emerald-600"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatNpr(transaction.amountPaisa)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
