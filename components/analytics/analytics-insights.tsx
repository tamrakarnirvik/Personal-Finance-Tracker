
"use client";

import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  TrendingUp,
  Wallet,
  Tags,
} from "lucide-react";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";

import {
  calculateTotals,
  formatNpr,
} from "@/lib/finance";

function getLocalMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function AnalyticsInsights() {
  const { transactions } = useTransactions();
  const { getCategoryName } = useCategories();

  const insights = useMemo(() => {
    const today = new Date();

    const currentKey = getLocalMonthKey(today);

    const previousDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const previousKey = getLocalMonthKey(previousDate);

    const currentTransactions = transactions.filter(
      (transaction) =>
        transaction.occurredOn.startsWith(currentKey)
    );

    const previousTransactions = transactions.filter(
      (transaction) =>
        transaction.occurredOn.startsWith(previousKey)
    );

    const currentTotals = calculateTotals(
      currentTransactions
    );

    const previousTotals = calculateTotals(
      previousTransactions
    );

    const currentExpenses = currentTotals.expensePaisa;
    const previousExpenses = previousTotals.expensePaisa;

    const difference = currentExpenses - previousExpenses;

    const percentageChange =
      previousExpenses > 0
        ? (difference / previousExpenses) * 100
        : null;

    const categoryTotals = new Map<string, number>();

    for (const transaction of currentTransactions) {
      if (transaction.type !== "expense") continue;

      categoryTotals.set(
        transaction.categoryId,
        (categoryTotals.get(transaction.categoryId) ?? 0) +
          transaction.amountPaisa
      );
    }

    const topCategory = [...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    return {
      currentExpenses,
      previousExpenses,
      difference,
      percentageChange,
      topCategory,
      currentKey,
      previousKey,
    };
  }, [transactions]);

  const currentMonthLabel = new Date(
    `${insights.currentKey}-01T12:00:00`
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const previousMonthLabel = new Date(
    `${insights.previousKey}-01T12:00:00`
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const spendingIncreased = insights.difference > 0;
  const spendingDecreased = insights.difference < 0;

  return (
    <section
      aria-label="Analytics insights"
      className="space-y-5"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          Spending intelligence
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Understand your spending
        </h2>

        <p className="mt-2 text-[13px] text-muted-foreground">
          A comparison of your current and previous month.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Current month */}
        <div className="clean-panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              This month
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              <Wallet size={19} />
            </div>
          </div>

          <p className="mt-5 wrap-break-word text-[22px] font-semibold tracking-tight tabular-nums">
            {formatNpr(insights.currentExpenses)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {currentMonthLabel}
          </p>
        </div>

        {/* Previous month */}
        <div className="clean-panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Previous month
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <CalendarDays size={19} />
            </div>
          </div>

          <p className="mt-5 wrap-break-word text-[22px] font-semibold tracking-tight tabular-nums">
            {formatNpr(insights.previousExpenses)}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {previousMonthLabel}
          </p>
        </div>

        {/* Monthly change */}
        <div className="clean-panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Spending change
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              {spendingDecreased ? (
                <ArrowDownRight size={19} />
              ) : spendingIncreased ? (
                <ArrowUpRight size={19} />
              ) : (
                <TrendingUp size={19} />
              )}
            </div>
          </div>

          <p className="mt-5 wrap-break-word text-[22px] font-semibold tracking-tight tabular-nums">
            {insights.percentageChange === null
              ? "N/A"
              : `${insights.percentageChange > 0 ? "+" : ""}${insights.percentageChange.toFixed(1)}%`}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {insights.percentageChange === null
              ? "No prior-month spending to compare"
              : spendingIncreased
                ? "Higher than last month"
                : spendingDecreased
                  ? "Lower than last month"
                  : "Unchanged from last month"}
          </p>
        </div>

        {/* Top category */}
        <div className="clean-panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Top expense category
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Tags size={19} />
            </div>
          </div>

          <p className="mt-5 truncate text-lg font-semibold tracking-tight text-foreground">
            {insights.topCategory
              ? getCategoryName(insights.topCategory[0])
              : "No expenses yet"}
          </p>

          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            {insights.topCategory
              ? formatNpr(insights.topCategory[1])
              : "No spending recorded this month"}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This comparison uses recorded expenses for each calendar
        month. The current month is not yet complete, so its total
        may increase. Account transfers are excluded.
      </p>
    </section>
  );
}
