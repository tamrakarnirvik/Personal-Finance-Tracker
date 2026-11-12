
"use client";

import { useMemo, useState } from "react";
import { Trash2, RotateCcw, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

import {
  calculateTotals,
  formatNpr,
  parseNprToPaisa,
} from "@/lib/finance";

import {
  categoryOptions,
  getCategoryName,
} from "@/lib/transaction-categories";

import {
  filterTransactions,
  type TransactionSort,
  type TransactionTypeFilter,
} from "@/lib/transaction-filters";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import { TransactionDialog } from "@/components/transactions/transaction-dialog";

const controlClass =
  "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  // Zero is valid for a filter, unlike an actual transaction.
  if (/^0+(?:\.0{1,2})?$/.test(trimmed)) {
    return 0;
  }

  return parseNprToPaisa(trimmed);
}

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    deleteEntry,
  } = useTransactions();

  const [search, setSearch] = useState("");
  const [type, setType] =
    useState<TransactionTypeFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sort, setSort] =
    useState<TransactionSort>("newest");

  const categories =
    type === "income"
      ? categoryOptions.income
      : type === "expense"
        ? categoryOptions.expense
        : type === "transfer"
          ? []
          : [
              ...categoryOptions.expense,
              ...categoryOptions.income,
            ];

  const result = useMemo(() => {
    try {
      const minAmountPaisa = parseOptionalAmount(minAmount);
      const maxAmountPaisa = parseOptionalAmount(maxAmount);

      if (fromDate && toDate && fromDate > toDate) {
        throw new Error(
          "The start date must be before the end date."
        );
      }

      if (
        minAmountPaisa !== null &&
        maxAmountPaisa !== null &&
        minAmountPaisa > maxAmountPaisa
      ) {
        throw new Error(
          "Minimum amount cannot exceed maximum amount."
        );
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
        }
      );

      return { rows, error: "" };
    } catch (error) {
      return {
        rows: [],
        error:
          error instanceof Error
            ? error.message
            : "Invalid filter.",
      };
    }
  }, [
    transactions,
    accounts,
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
    return (
      accounts.find((account) => account.id === id)?.name ??
      "Unknown Account"
    );
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

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Transactions"
          description="Search and manage your financial history"
        />
        <TransactionDialog />
      </div>

      {/* Filter panel */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Filter Transactions</h2>
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <label htmlFor="filter-search" className="text-sm font-medium">
                Search
              </label>
              <input
                id="filter-search"
                type="search"
                placeholder="Search transactions..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className={controlClass}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label htmlFor="filter-type" className="text-sm font-medium">
                Transaction type
              </label>
              <select
                id="filter-type"
                value={type}
                onChange={(event) => {
                  setType(
                    event.target.value as TransactionTypeFilter
                  );
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

            {/* Category */}
            <div className="space-y-2">
              <label
                htmlFor="filter-category"
                className="text-sm font-medium"
              >
                Category
              </label>
              <select
                id="filter-category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                disabled={type === "transfer"}
                className={controlClass}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <label
                htmlFor="filter-account"
                className="text-sm font-medium"
              >
                Account
              </label>
              <select
                id="filter-account"
                value={accountId}
                onChange={(event) =>
                  setAccountId(event.target.value)
                }
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

            {/* Date range */}
            <div className="space-y-2">
              <label
                htmlFor="filter-from"
                className="text-sm font-medium"
              >
                From date
              </label>
              <input
                id="filter-from"
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(event.target.value)
                }
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="filter-to"
                className="text-sm font-medium"
              >
                To date
              </label>
              <input
                id="filter-to"
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(event.target.value)
                }
                className={controlClass}
              />
            </div>

            {/* Amount range */}
            <div className="space-y-2">
              <label
                htmlFor="filter-min"
                className="text-sm font-medium"
              >
                Minimum amount (NPR)
              </label>
              <input
                id="filter-min"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(event.target.value)
                }
                className={controlClass}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="filter-max"
                className="text-sm font-medium"
              >
                Maximum amount (NPR)
              </label>
              <input
                id="filter-max"
                type="text"
                inputMode="decimal"
                placeholder="No limit"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(event.target.value)
                }
                className={controlClass}
              />
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <label
                htmlFor="filter-sort"
                className="text-sm font-medium"
              >
                Sort by
              </label>
              <select
                id="filter-sort"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as TransactionSort)
                }
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
            <p role="alert" className="text-sm text-red-600">
              {result.error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtered summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Filtered Income",
            value: totals.incomePaisa,
          },
          {
            label: "Filtered Expenses",
            value: totals.expensePaisa,
          },
          {
            label: "Net Income",
            value: totals.netPaisa,
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatNpr(item.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions history */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              Transaction History
            </h2>
            <span className="text-sm text-slate-500">
              {result.rows.length} of {transactions.length} records
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {!result.error && result.rows.length === 0 && (
              <div className="py-12 text-center">
                <p className="font-medium">
                  No matching transactions
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Try adjusting or clearing your filters.
                </p>
              </div>
            )}

            {result.rows.map((transaction) => {
              const transfer = transaction.type === "transfer";
              const income = transaction.type === "income";

              const description = transfer
                ? `${accountName(transaction.fromAccountId)} → ${accountName(transaction.toAccountId)}`
                : `${getCategoryName(transaction.categoryId)} · ${accountName(transaction.accountId)}`;

              const title = transfer
                ? transaction.note || "Account Transfer"
                : transaction.note ||
                  getCategoryName(transaction.categoryId);

              return (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {transfer && (
                      <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                        <ArrowLeftRight size={17} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {description}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.occurredOn}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <p
                      className={`text-sm font-semibold ${
                        income
                          ? "text-emerald-600"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {income ? "+" : transfer ? "" : "−"}
                      {formatNpr(transaction.amountPaisa)}
                    </p>

                    {transfer ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800">
                        Transfer
                      </span>
                    ) : (
                      <>
                        <TransactionDialog transaction={transaction} />

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-label={`Delete transaction ${title}`}
                          onClick={() =>
                            removeEntry(transaction.id)
                          }
                        >
                          <Trash2 size={15} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Transfers are shown for reference and excluded from
        income and expense totals. Your transaction data is
        still saved locally in this browser.
      </p>
    </div>
  );
}
