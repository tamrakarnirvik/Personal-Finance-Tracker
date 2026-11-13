
"use client";

import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ReceiptText,
} from "lucide-react";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { calculateTotals, formatNpr } from "@/lib/finance";
import { getMonthKey } from "@/lib/finance-analytics";

export function TransactionsOverview() {
  const { transactions } = useTransactions();

  const monthKey = getMonthKey(new Date());

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        transaction.occurredOn.startsWith(monthKey)
      ),
    [transactions, monthKey]
  );

  const totals = useMemo(
    () => calculateTotals(monthlyTransactions),
    [monthlyTransactions]
  );

  const transferCount = monthlyTransactions.filter(
    (transaction) => transaction.type === "transfer"
  ).length;

  const monthLabel = new Date(
    `${monthKey}-01T12:00:00`
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const metrics = [
    {
      title: "Income",
      amount: totals.incomePaisa,
      icon: ArrowDownLeft,
      iconClass:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      title: "Expenses",
      amount: totals.expensePaisa,
      icon: ArrowUpRight,
      iconClass:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    },
    {
      title: "Net cash flow",
      amount: totals.netPaisa,
      icon: ArrowLeftRight,
      iconClass:
        "bg-muted text-foreground",
    },
  ];

  return (
    <section
      aria-label="Monthly transaction overview"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
            Money movement
          </p>

          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Your cash flow at a glance
          </h2>

          <p className="mt-2 text-[13px] text-muted-foreground">
            Financial activity for {monthLabel}.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <ReceiptText size={15} />
          {monthlyTransactions.length} records
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className="clean-panel min-w-0 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {metric.title}
                </p>

                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${metric.iconClass}`}
                >
                  <Icon size={19} strokeWidth={1.8} />
                </div>
              </div>

              <p className="mt-5 wrap-break-word text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {formatNpr(metric.amount)}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {metric.title === "Net cash flow"
                  ? "Income minus expenses"
                  : `Recorded in ${monthLabel}`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ArrowLeftRight size={14} />
        {transferCount} account{" "}
        {transferCount === 1 ? "transfer" : "transfers"}{" "}
        this month
        <span className="text-border">•</span>
        Transfers are excluded from income and expenses
      </div>
    </section>
  );
}
