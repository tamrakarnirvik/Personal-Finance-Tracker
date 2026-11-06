
"use client";

import { motion } from "motion/react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import {
  calculateTotals,
  calculateAccountBalance,
} from "@/lib/finance";


import type { SummaryItem } from "@/lib/dashboard-data";

import { PageHeading } from "@/components/layout/page-heading";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useTransactions } from "@/components/transactions/transaction-provider";


function currentMonthKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

export default function DashboardPage() {
  
const { transactions, accounts } = useTransactions();


  const monthlyTransactions = transactions.filter(
    (transaction) =>
      transaction.occurredOn.startsWith(currentMonthKey())
  );

  const monthlyTotals = calculateTotals(
    monthlyTransactions
  );

  const balancePaisa = accounts.reduce(
  (total, account) =>
    total + calculateAccountBalance(account, transactions),
  0
);

  const summary: SummaryItem[] = [
    {
      label: "Total Balance",
      amount: balancePaisa / 100,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Monthly Income",
      amount: monthlyTotals.incomePaisa / 100,
      icon: ArrowDownLeft,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Monthly Expenses",
      amount: monthlyTotals.expensePaisa / 100,
      icon: ArrowUpRight,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Dashboard"
          description="Your financial overview"
        />

        <TransactionDialog />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.07,
            }}
          >
            <SummaryCard item={item} />
          </motion.div>
        ))}
      </div>

      {/* Chart is still sample data */}
      <SpendingChart />

      {/* Live transaction list */}
      <RecentTransactions />

      <p className="text-xs text-amber-700 dark:text-amber-400">
        Prototype mode: the wallet starts at Rs. 0, all
        entries use that wallet, and changes reset on refresh.
        Account management and permanent storage come later.
      </p>
    </div>
  );
}
