
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CreditCard,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  TransactionDialog,
} from "@/components/transactions/transaction-dialog";

import {
  SpendingChart,
} from "@/components/dashboard/spending-chart";

import {
  CategoryBreakdown,
} from "@/components/dashboard/category-breakdown";

import {
  calculateAccountBalance,
  calculateTotals,
  formatNpr,
} from "@/lib/finance";

import {
  getMonthKey,
} from "@/lib/finance-analytics";

import type {
  FinanceTransaction,
} from "@/types/finance";

/* ==========================================
   HELPER COMPONENTS
   ========================================== */

type MetricTone = "income" | "expense" | "neutral";

interface MetricCardProps {
  title: string;
  amountPaisa: number;
  subtitle: string;
  icon: LucideIcon;
  tone: MetricTone;
}

function MetricCard({
  title,
  amountPaisa,
  subtitle,
  icon: Icon,
  tone,
}: MetricCardProps) {
  const tones = {
    income: {
      icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      amount: "text-emerald-700 dark:text-emerald-300",
    },
    expense: {
      icon: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      amount: "text-foreground",
    },
    neutral: {
      icon: "bg-muted text-foreground",
      amount: "text-foreground",
    },
  };

  const colors = tones[tone];

  return (
    <section className="clean-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">
          {title}
        </p>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      <p
        className={`mt-5 wrap-break-word text-2xl font-semibold tracking-tight tabular-nums sm:text-[27px] ${colors.amount}`}
      >
        {formatNpr(amountPaisa)}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        {subtitle}
      </p>
    </section>
  );
}

function SectionHeading({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {href && linkText && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-75"
        >
          {linkText}
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

function RecentTransactionRow({
  transaction,
  accountNames,
  getCategoryName,
}: {
  transaction: FinanceTransaction;
  accountNames: Map<string, string>;
  getCategoryName: (id: string) => string;
}) {
  const isTransfer = transaction.type === "transfer";
  const isIncome = transaction.type === "income";

  const title =
    transaction.note?.trim() ||
    (isTransfer
      ? "Account transfer"
      : getCategoryName(transaction.categoryId));

  let subtitle = "";

  if (isTransfer) {
    const from =
      accountNames.get(transaction.fromAccountId) ??
      "Unknown account";

    const to =
      accountNames.get(transaction.toAccountId) ??
      "Unknown account";

    subtitle = `${from} → ${to}`;
  } else {
    const categoryName = getCategoryName(
      transaction.categoryId
    );

    const accountName =
      accountNames.get(transaction.accountId) ??
      "Unknown account";

    subtitle = `${categoryName} · ${accountName}`;
  }

  const Icon = isTransfer
    ? ArrowLeftRight
    : isIncome
      ? ArrowDownLeft
      : ArrowUpRight;

  const amountPrefix = isTransfer
    ? ""
    : isIncome
      ? "+"
      : "−";

  const amountColor = isTransfer
    ? "text-foreground"
    : isIncome
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-foreground";

  const dateLabel = new Date(
    `${transaction.occurredOn}T12:00:00`
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-border/70 py-4 last:border-0">
      <div
        className={[
          "flex size-11 shrink-0 items-center",
          "justify-center rounded-xl",
          isIncome
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        ].join(" ")}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground sm:text-sm">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-[13px] font-semibold tabular-nums sm:text-sm ${amountColor}`}
        >
          {amountPrefix}
          {formatNpr(transaction.amountPaisa)}
        </p>

        <p className="mt-1 text-[11px] text-muted-foreground">
          {dateLabel}
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   MAIN DASHBOARD
   ========================================== */

export default function DashboardPage() {
  const { accounts, transactions } = useTransactions();

  const { getCategoryName } = useCategories();

  const [monthKey] = useState(() =>
    getMonthKey(new Date())
  );

  // Financial balance across all accounts.
  const totalBalancePaisa = useMemo(
    () =>
      accounts.reduce(
        (sum, account) =>
          sum +
          calculateAccountBalance(account, transactions),
        0
      ),
    [accounts, transactions]
  );

  // Monthly income and expense totals.
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.occurredOn.startsWith(monthKey)
      ),
    [transactions, monthKey]
  );

  const monthlyTotals = useMemo(
    () => calculateTotals(monthlyTransactions),
    [monthlyTransactions]
  );

  // Most recent transactions.
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            b.occurredOn.localeCompare(a.occurredOn) ||
            b.id.localeCompare(a.id)
        )
        .slice(0, 5),
    [transactions]
  );

  const accountNames = useMemo(
    () =>
      new Map(
        accounts.map((account) => [
          account.id,
          account.name,
        ])
      ),
    [accounts]
  );

  const monthLabel = useMemo(() => {
    const [year, month] = monthKey
      .split("-")
      .map(Number);

    return new Date(year, month - 1, 1)
      .toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
  }, [monthKey]);

  return (
    <div className="space-y-8 pb-6 sm:space-y-10">
      {/* ======================================
          PAGE HEADING
          ====================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarDays size={14} />
            {monthLabel}
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
  Dashboard
</h1>

          <p className="mt-2 text-[13px] text-muted-foreground sm:text-sm">
            A clear picture of your money, all in one place.
          </p>
        </div>

        <TransactionDialog />
      </div>

      {/* ======================================
          TOTAL BALANCE HERO
          ====================================== */}

      <section
        className="relative overflow-hidden rounded-[22px] bg-[#146B55] p-6 text-white shadow-sm sm:p-8"
        aria-label="Total account balance"
      >
        {/* Soft decorative shapes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-44 right-12 size-72 rounded-full border border-white/10"
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[13px] font-medium text-white/80">
              <Wallet size={17} />
              Total balance
            </p>

            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
              NPR
            </span>
          </div>

          <p
            data-testid="dashboard-total-balance"
            className="mt-5 wrap-break-word text-[32px] font-semibold tracking-tight tabular-nums sm:text-[42px]"
          >
            {formatNpr(totalBalancePaisa)}
          </p>

          <p className="mt-2 text-xs text-white/70 sm:text-sm">
            Combined balance across {accounts.length}{" "}
            {accounts.length === 1 ? "account" : "accounts"}
          </p>

          <div className="mt-8 border-t border-white/20 pt-5">
            <Link
              href="/accounts"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-75"
            >
              View your accounts
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================
          FINANCIAL METRICS
          ====================================== */}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Monthly income"
          amountPaisa={monthlyTotals.incomePaisa}
          subtitle={`Money received in ${monthLabel}`}
          icon={ArrowDownLeft}
          tone="income"
        />

        <MetricCard
          title="Monthly expenses"
          amountPaisa={monthlyTotals.expensePaisa}
          subtitle={`Money spent in ${monthLabel}`}
          icon={ArrowUpRight}
          tone="expense"
        />

        <MetricCard
          title="Net cash flow"
          amountPaisa={monthlyTotals.netPaisa}
          subtitle="Income minus expenses"
          icon={ArrowLeftRight}
          tone="neutral"
        />
      </div>

      {/* ======================================
          LIVE FINANCIAL CHARTS
          ====================================== */}

      <section className="space-y-4">
        <SectionHeading
          title="Your financial activity"
          description="Track income, expenses and spending patterns."
          href="/analytics"
          linkText="Detailed analytics"
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <SpendingChart months={6} />
          </div>

          <div className="min-w-0">
            <CategoryBreakdown monthKey={monthKey} />
          </div>
        </div>
      </section>

      {/* ======================================
          TRANSACTIONS + ACCOUNTS
          ====================================== */}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Recent transactions */}
        <section className="clean-panel min-w-0 p-5 sm:p-6">
          <SectionHeading
            title="Recent transactions"
            description="Your latest financial activity"
            href="/transactions"
            linkText="View all"
          />

          <div className="mt-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <RecentTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  accountNames={accountNames}
                  getCategoryName={getCategoryName}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <ReceiptText
                    size={21}
                    className="text-muted-foreground"
                  />
                </div>

                <p className="text-sm font-semibold">
                  No transactions yet
                </p>

                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Your latest income, expenses and transfers
                  will appear here.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Accounts overview */}
        <section className="clean-panel min-w-0 p-5 sm:p-6">
          <SectionHeading
            title="Your accounts"
            description="Current available balances"
            href="/accounts"
            linkText="Manage"
          />

          <div className="mt-4 divide-y divide-border/70">
            {accounts.length > 0 ? (
              accounts.map((account) => {
                const balance = calculateAccountBalance(
                  account,
                  transactions
                );

                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 py-4 first:pt-1"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                      <CreditCard size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">
                        {account.name}
                      </p>

                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {account.type} account
                      </p>
                    </div>

                    <p
                      className={`shrink-0 text-right text-[13px] font-semibold tabular-nums ${
                        balance < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatNpr(balance)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No accounts available.
              </p>
            )}
          </div>

          <Link
            href="/accounts"
            className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Manage your accounts
            <ChevronRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
