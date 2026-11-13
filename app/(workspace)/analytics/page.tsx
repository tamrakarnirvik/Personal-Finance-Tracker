"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  Landmark,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { AnalyticsInsights } from "@/components/analytics/analytics-insights";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { useTransactions } from "@/components/transactions/transaction-provider";
import {
  calculateAccountBalance,
  calculateTotals,
  formatNpr,
} from "@/lib/finance";
import {
  calculateSavingsRate,
  getMonthKey,
  getMonthTransactions,
} from "@/lib/finance-analytics";

interface ReportMetric {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  valueClass: string;
}

export default function AnalyticsPage() {
  const { transactions, accounts } = useTransactions();

  // Preserved: the reporting month controls the KPI cards and category chart.
  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));

  const monthlyTransactions = getMonthTransactions(transactions, monthKey);
  const { incomePaisa, expensePaisa, netPaisa } = calculateTotals(
    monthlyTransactions
  );
  const savingsRate = calculateSavingsRate(incomePaisa, expensePaisa);

  // Preserved: account balances use all recorded activity, not just one month.
  const accountBalances = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balancePaisa: calculateAccountBalance(account, transactions),
  }));

  const totalBalance = accountBalances.reduce(
    (total, account) => total + account.balancePaisa,
    0
  );

  const monthLabel = monthKey
    ? new Date(`${monthKey}-01T12:00:00`).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "Selected month";

  const metrics: ReportMetric[] = [
    {
      label: "Monthly Income",
      value: formatNpr(incomePaisa),
      description: "Income recorded in the selected month",
      icon: ArrowDownLeft,
      iconClass:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      valueClass: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Monthly Expenses",
      value: formatNpr(expensePaisa),
      description: "Expenses recorded in the selected month",
      icon: ArrowUpRight,
      iconClass:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      valueClass: "text-foreground",
    },
    {
      label: "Net Income",
      value: formatNpr(netPaisa),
      description: "Income minus expenses",
      icon: ArrowLeftRight,
      iconClass: "bg-muted text-foreground",
      valueClass: "text-foreground",
    },
    {
      label: "Savings Rate",
      value: savingsRate === null ? "—" : `${savingsRate.toFixed(1)}%`,
      description:
        savingsRate === null
          ? "No income recorded for this month"
          : "Net income as a percentage of income",
      icon: PiggyBank,
      iconClass: "bg-accent text-accent-foreground",
      valueClass: "text-foreground",
    },
  ];

  return (
    <div className="space-y-8 pb-6 sm:space-y-10">
      {/* Page heading and existing reporting-month control */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <PageHeading
          title="Analytics"
          description="Understand your income, spending and balances"
        />

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <CalendarDays size={18} strokeWidth={1.8} />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="analytics-month"
              className="block text-xs font-medium text-muted-foreground"
            >
              Reporting Month
            </label>
            <input
              id="analytics-month"
              aria-label="Reporting Month"
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
              className="h-10 min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
      </div>

      {/* Insights compare the current calendar month to the previous month. */}
      <AnalyticsInsights />

      {/* The cards below follow the selected reporting month. */}
      <section aria-label="Selected month financial metrics" className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Monthly report
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {monthLabel} performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial results for your selected reporting month.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.label}
                className="min-w-0 rounded-2xl border-border bg-card shadow-sm"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${metric.iconClass}`}
                    >
                      <Icon size={19} strokeWidth={1.8} />
                    </div>
                  </div>
                  <p
                    className={`mt-5 break-words text-2xl font-semibold tracking-tight tabular-nums ${metric.valueClass}`}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Retain the existing live 12-month chart component. */}
      <section className="min-w-0 space-y-4" aria-label="Historical spending trends">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Historical trends
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A rolling 12-month view of income and spending.
          </p>
        </div>
        <SpendingChart months={12} />
      </section>

      {/* Category chart and all-time account balances */}
      <section className="space-y-4" aria-label="Category and account analysis">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Spending and accounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Category activity for {monthLabel}, alongside current account balances.
          </p>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <div className="min-w-0">
            <CategoryBreakdown monthKey={monthKey} />
          </div>

          <Card className="min-w-0 rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Account Overview
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Balances from all recorded account activity
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Landmark size={19} strokeWidth={1.8} />
                </div>
              </div>

              <div className="mt-5 divide-y divide-border">
                {accountBalances.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Wallet className="text-muted-foreground" size={25} />
                    <p className="mt-3 text-sm text-muted-foreground">
                      No accounts available.
                    </p>
                  </div>
                ) : (
                  accountBalances.map((account) => (
                    <div
                      key={account.id}
                      className="flex min-w-0 items-center justify-between gap-3 py-4 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {account.name}
                        </p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {account.type}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-right text-sm font-semibold tabular-nums ${
                          account.balancePaisa < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground"
                        }`}
                      >
                        {formatNpr(account.balancePaisa)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </span>
                <span className="break-words text-lg font-semibold tracking-tight tabular-nums text-foreground">
                  {formatNpr(totalBalance)}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Account balances include opening balances and all recorded transactions,
                regardless of the reporting month.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Monthly figures exclude internal account transfers. The 12-month chart
        uses a rolling period ending in the current month, independently of the
        selected reporting month.
      </p>
    </div>
  );
}
