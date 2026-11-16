
"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Download,
  History,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  useRecurringAutomationStore,
} from "@/components/recurring/recurring-automation-store";

import {
  formatNpr,
} from "@/lib/finance";

import {
  buildRecurringPostingHistory,
  createRecurringHistoryCsv,
} from "@/lib/recurring-posting-history";

// ==========================================
// HISTORY FILTER TYPE
// ==========================================

type FilterType =
  | "all"
  | "income"
  | "expense";

// ==========================================
// MAIN POSTING HISTORY COMPONENT
// ==========================================

export function RecurringPostingHistory() {
  const {
    transactions,
    accounts,
  } = useTransactions();

  const {
    getCategoryName,
  } = useCategories();

  const {
    schedules,
    error: storageError,
  } = useRecurringAutomationStore();

  const [filter, setFilter] =
    useState<FilterType>("all");

  const [showAll, setShowAll] =
    useState(false);

  const [exportError, setExportError] =
    useState("");

  // ========================================
  // CALCULATE POSTING HISTORY
  // ========================================

  const history = useMemo(
    () =>
      buildRecurringPostingHistory(
        transactions,
        schedules
      ),
    [transactions, schedules]
  );

  // ========================================
  // APPLY FILTER
  // ========================================

  const filtered = history.filter(
    (item) =>
      filter === "all" ||
      item.type === filter
  );

  const visible = showAll
    ? filtered
    : filtered.slice(0, 8);

  // ========================================
  // ACCOUNT LOOKUP
  // ========================================

  const accountNames = new Map(
    accounts.map(
      (item) => [
        item.id,
        item.name,
      ]
    )
  );

  const accountName = (
    id: string
  ) =>
    accountNames.get(id) ??
    "Unknown account";

  // ========================================
  // EXPORT CSV
  // ========================================

  function downloadCsv() {
    setExportError("");

    try {
      const csv =
        createRecurringHistoryCsv(
          filtered,
          accountName,
          getCategoryName
        );

      const blob = new Blob(
        [csv],
        {
          type: "text/csv;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        `expense-tracker-recurring-history-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.csv`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(url),
        1000
      );
    } catch {
      setExportError(
        "Could not export recurring posting history."
      );
    }
  }

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <section
      aria-label="Recurring posting history"
      className="clean-panel space-y-5 p-5 sm:p-6"
    >
      {/* HEADING */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History
              size={19}
              className="text-primary"
            />

            <h2 className="text-base font-semibold">
              Posting history
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Income and expenses already
            recorded from recurring schedules.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={downloadCsv}
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* FILTER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor="recurring-history-filter"
          className="text-sm font-medium"
        >
          Filter posted entries
        </label>

        <select
          id="recurring-history-filter"
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
          value={filter}
          onChange={(event) => {
            setFilter(
              event.target.value as FilterType
            );

            setShowAll(false);
          }}
        >
          <option value="all">
            All entries
          </option>

          <option value="income">
            Income
          </option>

          <option value="expense">
            Expenses
          </option>
        </select>
      </div>

      {/* STORAGE WARNING */}

      {storageError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Schedules could not be loaded.
          Posted transactions still appear,
          but some names may be unavailable.
        </p>
      )}

      {/* HISTORY LIST */}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          No posted recurring transactions
          match this filter.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border px-4">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              {/* INFORMATION */}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {entry.scheduleName}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.occurredOn}
                  {" · "}
                  {entry.frequency}
                  {" · "}
                  {getCategoryName(
                    entry.categoryId
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {accountName(
                    entry.accountId
                  )}
                </p>
              </div>

              {/* AMOUNT */}

              <div className="text-right">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    entry.type === "income"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-foreground"
                  }`}
                >
                  {entry.type === "income"
                    ? "+"
                    : "−"}

                  {formatNpr(
                    entry.amountPaisa
                  )}
                </p>

                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {entry.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EXPAND HISTORY */}

      {filtered.length > 8 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setShowAll(!showAll)
          }
        >
          {showAll
            ? "Show fewer"
            : `Show all ${filtered.length} entries`}
        </Button>
      )}

      {/* EXPORT ERROR */}

      {exportError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {exportError}
        </p>
      )}

      {/* FOOTER */}

      <p className="text-xs text-muted-foreground">
        Derived from recorded transactions,
        not a separate audit trail.
        Deleted transactions no longer
        appear here.

        See{" "}
        <Link
          href="/transactions"
          className="font-medium text-primary hover:underline"
        >
          Transactions
        </Link>{" "}
        for edits and details.
      </p>
    </section>
  );
}
