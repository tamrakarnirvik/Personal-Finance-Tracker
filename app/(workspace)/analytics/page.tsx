
"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

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

export default function AnalyticsPage() {
  const { transactions, accounts } = useTransactions();

  // Selected month for KPIs and category analysis.
  const [monthKey, setMonthKey] = useState(
    () => getMonthKey(new Date())
  );

  const monthlyTransactions = getMonthTransactions(
    transactions,
    monthKey
  );

  const {
    incomePaisa,
    expensePaisa,
    netPaisa,
  } = calculateTotals(monthlyTransactions);

  const savingsRate = calculateSavingsRate(
    incomePaisa,
    expensePaisa
  );

  const accountBalances = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balancePaisa: calculateAccountBalance(
      account,
      transactions
    ),
  }));

  const totalBalance = accountBalances.reduce(
    (total, account) =>
      total + account.balancePaisa,
    0
  );

  const metrics = [
    {
      label: "Monthly Income",
      value: formatNpr(incomePaisa),
      description: "Income recorded in the selected month",
    },
    {
      label: "Monthly Expenses",
      value: formatNpr(expensePaisa),
      description: "Expenses recorded in the selected month",
    },
    {
      label: "Net Income",
      value: formatNpr(netPaisa),
      description: "Income minus expenses",
    },
    {
      label: "Savings Rate",
      value:
        savingsRate === null
          ? "—"
          : `${savingsRate.toFixed(1)}%`,
      description:
        savingsRate === null
          ? "No income recorded for this month"
          : "Net income as a percentage of income",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Analytics"
          description="Understand your income, spending and balances"
        />

        <div className="space-y-1.5">
          <label
            htmlFor="analytics-month"
            className="block text-xs font-medium text-slate-500"
          >
            Reporting Month
          </label>

          <input
            id="analytics-month"
            aria-label="Reporting Month"
            type="month"
            value={monthKey}
            onChange={(event) =>
              setMonthKey(event.target.value)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Monthly metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="rounded-2xl shadow-sm"
          >
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">
                {metric.label}
              </p>

              <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight">
                {metric.value}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical trend */}
      <SpendingChart months={12} />

      {/* Category and account analysis */}
      <div className="grid gap-6 xl:grid-cols-2">
        <CategoryBreakdown monthKey={monthKey} />

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              Account Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Balances from all recorded account activity
            </p>

            <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
              {accountBalances.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No accounts available.
                </p>
              ) : (
                accountBalances.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.name}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {account.type}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold">
                      {formatNpr(account.balancePaisa)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-sm font-medium">
                Total Balance
              </span>

              <span className="text-lg font-semibold">
                {formatNpr(totalBalance)}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Account balances include opening balances
              and all recorded transactions, regardless
              of the reporting month.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500">
        Monthly figures exclude internal account transfers.
        The 12-month chart uses a rolling period ending
        in the current month, independently of the
        selected reporting month.
      </p>
    </div>
  );
}
