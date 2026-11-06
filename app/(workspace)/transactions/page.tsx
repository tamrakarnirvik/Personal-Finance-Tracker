
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

import {
  transactions,
  formatMoney,
} from "@/lib/dashboard-data";

export default function TransactionsPage() {
  return (
    <div>
      <PageHeading
        title="Transactions"
        description="View your financial activity"
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold">
              Transaction History
            </h2>

            <span className="text-xs text-slate-500">
              Demo records
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction) => {
              const isIncome = transaction.amount > 0;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {transaction.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {transaction.category}
                      {" · "}
                      {transaction.date}
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
                    {formatMoney(transaction.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
