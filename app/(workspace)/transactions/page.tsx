
"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ReceiptText,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { TransactionsOverview } from "@/components/transactions/transactions-overview";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";
import { calculateTotals, formatNpr, parseNprToPaisa } from "@/lib/finance";

import {
  filterTransactions,
  type TransactionSort,
  type TransactionTypeFilter,
} from "@/lib/transaction-filters";

const controlClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

// A blank amount means that the corresponding filter is not applied.
// Zero is valid for a search filter, even though it is not a valid
// amount when creating a financial transaction.
function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;
  if (/^0+(?:\.0{1,2})?$/.test(trimmed)) return 0;

  return parseNprToPaisa(trimmed);
}

export default function TransactionsPage() {
  const { transactions, accounts, deleteEntry } = useTransactions();
  const { categories, getCategoryName } = useCategories();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TransactionTypeFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sort, setSort] = useState<TransactionSort>("newest");

  const visibleCategories =
    type === "transfer"
      ? []
      : categories.filter(
          (category) => type === "all" || category.type === type
        );

  const result = useMemo(() => {
    try {
      const minAmountPaisa = parseOptionalAmount(minAmount);
      const maxAmountPaisa = parseOptionalAmount(maxAmount);

      if (fromDate && toDate && fromDate > toDate) {
        throw new Error("The start date must be before the end date.");
      }

      if (
        minAmountPaisa !== null &&
        maxAmountPaisa !== null &&
        minAmountPaisa > maxAmountPaisa
      ) {
        throw new Error("Minimum amount cannot exceed maximum amount.");
      }

      const rows = filterTransactions(
        transactions,
        accounts,
        {
          search,
          type,
          categoryId,
          accountId,
          fromDate,
          toDate,
          minAmountPaisa,
          maxAmountPaisa,
          sort,
        },
        categories
      );

      return { rows, error: "" };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error.message : "Invalid filter.",
      };
    }
  }, [
    transactions,
    accounts,
    categories,
    search,
    type,
    categoryId,
    accountId,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    sort,
  ]);

  const totals = calculateTotals(result.rows);

  const activeFilterCount = [
    search.trim() !== "",
    type !== "all",
    categoryId !== "",
    accountId !== "",
    fromDate !== "",
    toDate !== "",
    minAmount.trim() !== "",
    maxAmount.trim() !== "",
    sort !== "newest",
  ].filter(Boolean).length;

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  function resetFilters() {
    setSearch("");
    setType("all");
    setCategoryId("");
    setAccountId("");
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    setSort("newest");
  }

  function accountName(id: string): string {
    return accountNames.get(id) ?? "Unknown Account";
  }

  function removeEntry(id: string) {
    if (
      window.confirm(
        "Delete this transaction? This action cannot be undone."
      )
    ) {
      deleteEntry(id);
    }
  }

  const filteredMetrics = [
    {
      label: "Filtered Income",
      amountPaisa: totals.incomePaisa,
      Icon: ArrowDownLeft,
      iconClass:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      amountClass: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Filtered Expenses",
      amountPaisa: totals.expensePaisa,
      Icon: ArrowUpRight,
      iconClass:
        "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      amountClass: "text-foreground",
    },
    {
      label: "Net Income",
      amountPaisa: totals.netPaisa,
      Icon: ArrowLeftRight,
      iconClass: "bg-muted text-foreground",
      amountClass: "text-foreground",
    },
  ];

  return (
    <div className="finance-refresh space-y-7 pb-6 sm:space-y-9">
      {/* Header and existing add-transaction dialog */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Transactions"
          description="Search and manage your financial history"
        />
        <TransactionDialog />
      </div>

      {/* Existing live monthly overview */}
      <TransactionsOverview />

      {/* Advanced filter panel */}
      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <SlidersHorizontal size={19} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Filter Transactions
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Narrow your results by type, account, date, or amount.
                </p>
                {activeFilterCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              <RotateCcw size={15} />
              Clear filters
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 xl:col-span-2">
              <label htmlFor="filter-search" className="text-sm font-medium">
                Search
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="filter-search"
                  type="search"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`${controlClass} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-type" className="text-sm font-medium">
                Transaction type
              </label>
              <select
                id="filter-type"
                value={type}
                onChange={(event) => {
                  setType(event.target.value as TransactionTypeFilter);
                  setCategoryId("");
                }}
                className={controlClass}
              >
                <option value="all">All Transactions</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="filter-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={type === "transfer"}
                className={controlClass}
              >
                <option value="">All Categories</option>
                {visibleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-account" className="text-sm font-medium">
                Account
              </label>
              <select
                id="filter-account"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className={controlClass}
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-from" className="text-sm font-medium">
                From date
              </label>
              <input
                id="filter-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-to" className="text-sm font-medium">
                To date
              </label>
              <input
                id="filter-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-min" className="text-sm font-medium">
                Minimum amount (NPR)
              </label>
              <input
                id="filter-min"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={minAmount}
                onChange={(event) => setMinAmount(event.target.value)}
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-max" className="text-sm font-medium">
                Maximum amount (NPR)
              </label>
              <input
                id="filter-max"
                type="text"
                inputMode="decimal"
                placeholder="No limit"
                value={maxAmount}
                onChange={(event) => setMaxAmount(event.target.value)}
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="filter-sort" className="text-sm font-medium">
                Sort by
              </label>
              <select
                id="filter-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as TransactionSort)}
                className={controlClass}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>

          {result.error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {result.error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary of filtered results */}
      <section className="space-y-4" aria-label="Filtered transaction totals">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Filtered summary
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Totals update as you change your filters.
            </p>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            {result.rows.length} matching {result.rows.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {filteredMetrics.map((metric) => {
            const Icon = metric.Icon;

            return (
              <Card
                key={metric.label}
                className="min-w-0 rounded-2xl border-border bg-card shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <span
                      className={`flex size-9 items-center justify-center rounded-xl ${metric.iconClass}`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                  </div>
                  <p
                    className={`mt-4 wrap-break-word text-xl font-semibold tracking-tight tabular-nums ${metric.amountClass}`}
                  >
                    {formatNpr(metric.amountPaisa)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Transaction history, editing and deletion */}
      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <ReceiptText size={19} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Transaction History
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Income, expenses and account transfers
                </p>
              </div>
            </div>
            <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {result.rows.length} of {transactions.length} records
            </span>
          </div>

          {result.error ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Correct the filter above to display transactions.
            </div>
          ) : result.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ReceiptText size={22} />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                No matching transactions
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting or clearing your filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {result.rows.map((transaction) => {
                const isTransfer = transaction.type === "transfer";
                const isIncome = transaction.type === "income";

                const Icon = isTransfer
                  ? ArrowLeftRight
                  : isIncome
                    ? ArrowDownLeft
                    : ArrowUpRight;

                const title =
                  transaction.note?.trim() ||
                  (isTransfer
                    ? "Account Transfer"
                    : getCategoryName(transaction.categoryId));

                const description = isTransfer
                  ? `${accountName(transaction.fromAccountId)} → ${accountName(transaction.toAccountId)}`
                  : `${getCategoryName(transaction.categoryId)} · ${accountName(transaction.accountId)}`;

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-3 py-4 first:pt-1 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0">
                        <p className="wrap-break-word text-sm font-semibold text-foreground">
                          {title}
                        </p>
                        <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
                          {description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {transaction.occurredOn}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pl-13 sm:justify-end sm:pl-0">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          isIncome
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-foreground"
                        }`}
                      >
                        {isIncome ? "+" : isTransfer ? "" : "−"}
                        {formatNpr(transaction.amountPaisa)}
                      </p>

                      {transaction.type === "transfer" ? (
                        <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Transfer
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <TransactionDialog transaction={transaction} />

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            aria-label={`Delete transaction ${title}`}
                            onClick={() => removeEntry(transaction.id)}
                            className="border-border"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Transfers are shown for reference and excluded from income and expense
        totals. Your transaction data is still saved locally in this browser.
      </p>
    </div>
  );
}
