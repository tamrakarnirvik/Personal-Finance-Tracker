
"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/components/categories/category-provider";
import { useTransactions } from "@/components/transactions/transaction-provider";
import { formatNpr } from "@/lib/finance";

import {
  getCategorySpending,
  getMonthKey,
} from "@/lib/finance-analytics";

interface CategoryBreakdownProps {
  monthKey?: string;
}

export function CategoryBreakdown({
  monthKey,
}: CategoryBreakdownProps) {
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const selectedMonth =
    monthKey ?? getMonthKey(new Date());

  const spending = useMemo(
    () =>
      getCategorySpending(
        transactions,
        categories,
        selectedMonth
      ),
    [transactions, categories, selectedMonth]
  );

  const totalExpenses = spending.reduce(
    (sum, category) => sum + category.amountPaisa,
    0
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Spending by Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Expense distribution for {selectedMonth}
          </p>
        </div>

        {spending.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium">
              No expenses for this month
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Recorded expenses will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {spending.map((category) => (
              <div
                key={category.categoryId}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {category.name}
                  </span>

                  <span className="shrink-0 text-sm font-semibold">
                    {formatNpr(category.amountPaisa)}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                    style={{
                      width: `${category.percentage}%`,
                    }}
                  />
                </div>

                <p className="text-right text-xs text-slate-500">
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-sm font-medium">
            Total Expenses
          </span>

          <span className="text-sm font-semibold">
            {formatNpr(totalExpenses)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
