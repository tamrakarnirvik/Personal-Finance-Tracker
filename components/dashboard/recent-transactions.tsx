
import { Card, CardContent } from "@/components/ui/card";

import {
  transactions,
  formatMoney,
} from "@/lib/dashboard-data";

export function RecentTransactions() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <h3 className="mb-5 text-lg font-semibold">
          Recent Transactions
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((transaction) => {
            const isIncome = transaction.amount > 0;

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {transaction.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {transaction.category} · {transaction.date}
                  </p>
                </div>

                <p
                  className={`whitespace-nowrap text-sm font-semibold ${
                    isIncome
                      ? "text-emerald-600"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatMoney(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
