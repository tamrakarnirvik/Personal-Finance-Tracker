
"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  PiggyBank,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCategories } from "@/components/categories/category-provider";
import { useTransactions } from "@/components/transactions/transaction-provider";

import {
  formatNpr,
  parseNprToPaisa,
} from "@/lib/finance";

import { getMonthKey } from "@/lib/finance-analytics";

import {
  BUDGET_STORAGE_KEY,
  getBudgetProgress,
  isMonthlyBudget,
  summarizeMonthlyBudgets,
  type MonthlyBudget,
} from "@/lib/budget-planning";

// ==========================================
// CONSTANTS
// ==========================================

const BUDGET_CHANGE_EVENT =
  "expense-tracker-budgets-changed";

const STORAGE_UNAVAILABLE =
  "__expense_tracker_storage_unavailable__";

const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-50";

// ==========================================
// BROWSER STORAGE SUBSCRIPTION
// ==========================================

// Subscribe to storage updates from this tab
// and other browser tabs.

function subscribeToBudgets(
  onChange: () => void
) {
  window.addEventListener("storage", onChange);

  window.addEventListener(
    BUDGET_CHANGE_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      onChange
    );

    window.removeEventListener(
      BUDGET_CHANGE_EVENT,
      onChange
    );
  };
}

// Return a stable snapshot of saved data.

function getBudgetSnapshot(): string | null {
  try {
    return window.localStorage.getItem(
      BUDGET_STORAGE_KEY
    );
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

// Server-side rendering cannot access localStorage.

function getServerBudgetSnapshot(): string | null {
  return null;
}

// ==========================================
// VALIDATE SAVED BUDGET DATA
// ==========================================

function decodeBudgets(
  snapshot: string | null
): {
  budgets: MonthlyBudget[];
  storageProblem: string;
} {
  if (snapshot === null) {
    return {
      budgets: [],
      storageProblem: "",
    };
  }

  if (snapshot === STORAGE_UNAVAILABLE) {
    return {
      budgets: [],
      storageProblem:
        "Browser storage is unavailable. Budget editing is disabled.",
    };
  }

  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (
      !Array.isArray(parsed) ||
      !parsed.every(isMonthlyBudget)
    ) {
      throw new Error(
        "Invalid saved budget data"
      );
    }

    return {
      budgets: parsed as MonthlyBudget[],
      storageProblem: "",
    };
  } catch {
    return {
      budgets: [],
      storageProblem:
        "Saved budget data could not be read. Editing is disabled to avoid overwriting it.",
    };
  }
}

// ==========================================
// MAIN BUDGET MANAGER
// ==========================================

export function BudgetManager() {
  const { transactions } = useTransactions();

  const {
    categories,
    getCategoryName,
  } = useCategories();

  // ========================================
  // FORM STATE
  // ========================================

  const [monthKey, setMonthKey] = useState(
    () => getMonthKey(new Date())
  );

  const [categoryId, setCategoryId] =
    useState("");

  const [limit, setLimit] = useState("");

  const [formError, setFormError] =
    useState("");

  const [saveProblem, setSaveProblem] =
    useState("");

  // ========================================
  // REACTIVE BROWSER STORAGE
  // ========================================

  const snapshot = useSyncExternalStore(
    subscribeToBudgets,
    getBudgetSnapshot,
    getServerBudgetSnapshot
  );

  const {
    budgets,
    storageProblem,
  } = useMemo(
    () => decodeBudgets(snapshot),
    [snapshot]
  );

  // ========================================
  // EXPENSE CATEGORIES
  // ========================================

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === "expense"
      ),
    [categories]
  );

  // ========================================
  // MONTHLY BUDGET SUMMARY
  // ========================================

  const summary = useMemo(
    () =>
      summarizeMonthlyBudgets(
        budgets,
        transactions,
        monthKey
      ),
    [
      budgets,
      transactions,
      monthKey,
    ]
  );

  // Sort category budgets alphabetically.

  const sortedBudgets = useMemo(
    () =>
      [...summary.activeBudgets].sort(
        (a, b) =>
          getCategoryName(
            a.categoryId
          ).localeCompare(
            getCategoryName(
              b.categoryId
            )
          )
      ),
    [
      summary.activeBudgets,
      getCategoryName,
    ]
  );

  // ========================================
  // MONTH LABEL
  // ========================================

  const monthLabel = useMemo(() => {
    const [year, month] = monthKey
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleDateString(
      "en-GB",
      {
        month: "long",
        year: "numeric",
      }
    );
  }, [monthKey]);

  // ========================================
  // SAVE TO LOCAL STORAGE
  // ========================================

  // Storage updates happen only after a user action.
  // This avoids calling setState inside useEffect.

  function writeBudgets(
    nextBudgets: MonthlyBudget[]
  ): boolean {
    if (storageProblem) {
      return false;
    }

    try {
      window.localStorage.setItem(
        BUDGET_STORAGE_KEY,
        JSON.stringify(nextBudgets)
      );

      // Notify subscribed components.

      window.dispatchEvent(
        new Event(BUDGET_CHANGE_EVENT)
      );

      setSaveProblem("");

      return true;
    } catch {
      setSaveProblem(
        "Budget changes could not be saved in this browser."
      );

      return false;
    }
  }

  // ========================================
  // CREATE OR UPDATE A BUDGET
  // ========================================

  function saveBudget(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");

    if (storageProblem) {
      return;
    }

    // Validate expense category.

    if (
      !expenseCategories.some(
        (category) =>
          category.id === categoryId
      )
    ) {
      setFormError(
        "Choose an expense category."
      );

      return;
    }

    // Validate budget limit.

    let limitPaisa: number;

    try {
      limitPaisa = parseNprToPaisa(
        limit.trim()
      );

      if (
        !Number.isSafeInteger(limitPaisa) ||
        limitPaisa <= 0
      ) {
        throw new Error(
          "Invalid amount"
        );
      }
    } catch {
      setFormError(
        "Enter an amount greater than zero, such as 5000.00."
      );

      return;
    }

    // Check if the category already has
    // a budget for the selected month.

    const existing = budgets.find(
      (budget) =>
        budget.monthKey === monthKey &&
        budget.categoryId === categoryId
    );

    // Update existing or create new.

    const nextBudgets: MonthlyBudget[] =
      existing
        ? budgets.map((budget) =>
            budget.id === existing.id
              ? {
                  ...budget,
                  limitPaisa,
                }
              : budget
          )
        : [
            ...budgets,
            {
              id: window.crypto.randomUUID(),
              monthKey,
              categoryId,
              limitPaisa,
            },
          ];

    // Persist changes.

    if (writeBudgets(nextBudgets)) {
      setCategoryId("");
      setLimit("");
    }
  }

  // ========================================
  // EDIT EXISTING BUDGET
  // ========================================

  function editBudget(
    budget: MonthlyBudget
  ) {
    setCategoryId(
      budget.categoryId
    );

    setLimit(
      (budget.limitPaisa / 100).toFixed(2)
    );

    setFormError("");

    document
      .getElementById(
        "budget-category"
      )
      ?.focus();
  }

  // ========================================
  // DELETE BUDGET
  // ========================================

  function deleteBudget(
    budget: MonthlyBudget
  ) {
    const confirmed = window.confirm(
      `Remove the budget for ${getCategoryName(
        budget.categoryId
      )}?`
    );

    if (!confirmed) {
      return;
    }

    const nextBudgets = budgets.filter(
      (item) =>
        item.id !== budget.id
    );

    writeBudgets(nextBudgets);
  }

  // ========================================
  // EXPORT ALL BUDGET DATA
  // ========================================

  function exportBudgetData() {
    const payload = {
      version: 1,
      exportedAt:
        new Date().toISOString(),
      budgets,
    };

    const blob = new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      "expense-tracker-budgets-all-months.json";

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    window.setTimeout(
      () =>
        URL.revokeObjectURL(url),
      1000
    );
  }

  // ========================================
  // BUDGET SUMMARY CARDS
  // ========================================

  const metrics = [
    {
      label: "Allocated budgets",
      value: summary.allocatedPaisa,
      icon: Target,
    },
    {
      label: "Spent in budgeted categories",
      value: summary.budgetedSpentPaisa,
      icon: ArrowUpRight,
    },
    {
      label: "Remaining budget",
      value: summary.remainingPaisa,
      icon: PiggyBank,
    },
    {
      label: "Unbudgeted spending",
      value: summary.unbudgetedSpentPaisa,
      icon: AlertTriangle,
    },
  ];

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <div className="space-y-7 pb-6 sm:space-y-9">

      {/* MONTHLY PLANNING HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Monthly planning
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            Your spending budgets
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Set monthly limits for expense
            categories and compare them
            with actual spending.
          </p>
        </div>

        {/* MONTH SELECTOR */}

        <div className="space-y-2">
          <label
            htmlFor="budget-month"
            className="block text-xs font-medium text-muted-foreground"
          >
            Budget month
          </label>

          <input
            id="budget-month"
            type="month"
            value={monthKey}
            onChange={(event) => {
              const nextMonth =
                event.target.value;

              if (
                /^\d{4}-(0[1-9]|1[0-2])$/.test(
                  nextMonth
                )
              ) {
                setMonthKey(nextMonth);

                setCategoryId("");

                setLimit("");

                setFormError("");
              }
            }}
            className={fieldClass}
          />
        </div>

      </div>

      {/* SUMMARY METRICS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {metrics.map(
          ({
            label,
            value,
            icon: Icon,
          }) => (
            <section
              key={label}
              aria-label={label}
              className="clean-panel min-w-0 p-5"
            >
              <div className="flex items-start justify-between gap-3">

                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>

                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

              </div>

              <p className="mt-5 wrap-break-word text-[22px] font-semibold tracking-tight tabular-nums">
                {formatNpr(value)}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {monthLabel}
              </p>

            </section>
          )
        )}

      </div>

      {/* BUDGET FORM AND PROGRESS */}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">

        {/* CREATE OR UPDATE FORM */}

        <section
          className="clean-panel min-w-0 p-5 sm:p-6"
          aria-labelledby="budget-form-title"
        >

          <h3
            id="budget-form-title"
            className="text-base font-semibold"
          >
            Set a category budget
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Saving a new limit for the
            same category and month updates
            that budget.
          </p>

          <form
            onSubmit={saveBudget}
            className="mt-5 space-y-4"
          >

            {/* EXPENSE CATEGORY */}

            <div className="space-y-2">

              <label
                htmlFor="budget-category"
                className="block text-sm font-medium"
              >
                Expense category
              </label>

              <select
                id="budget-category"
                required
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                className={fieldClass}
              >

                <option value="">
                  Select category
                </option>

                {expenseCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}

              </select>
            </div>

            {/* BUDGET LIMIT */}

            <div className="space-y-2">

              <label
                htmlFor="budget-limit"
                className="block text-sm font-medium"
              >
                Monthly limit (NPR)
              </label>

              <input
                id="budget-limit"
                type="text"
                inputMode="decimal"
                required
                placeholder="e.g. 5000.00"
                value={limit}
                onChange={(event) =>
                  setLimit(
                    event.target.value
                  )
                }
                className={fieldClass}
              />
            </div>

            {/* FORM ERROR */}

            {formError && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            {/* SAVE BUTTON */}

            <Button
              type="submit"
              disabled={
                Boolean(storageProblem) ||
                expenseCategories.length === 0
              }
            >
              <Plus size={16} />

              Save budget
            </Button>

          </form>
        </section>

        {/* CATEGORY PROGRESS */}

        <section
          className="clean-panel min-w-0 p-5 sm:p-6"
          aria-labelledby="budget-progress-title"
        >

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <h3
                id="budget-progress-title"
                className="text-base font-semibold"
              >
                Category progress
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Actual expenses for {monthLabel}
              </p>

            </div>

            {/* EXPORT BUTTON */}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={exportBudgetData}
              disabled={
                Boolean(storageProblem)
              }
            >
              <Download size={15} />

              Export budgets
            </Button>

          </div>

          {/* EMPTY STATE */}

          {sortedBudgets.length === 0 ? (

            <div className="py-12 text-center text-sm text-muted-foreground">
              No budgets for this month.
              Select a category to start planning.
            </div>

          ) : (

            <div className="mt-5 space-y-5">

              {sortedBudgets.map(
                (budget) => {

                  const spentPaisa =
                    summary.spentByCategory.get(
                      budget.categoryId
                    ) ?? 0;

                  const progress =
                    getBudgetProgress(
                      budget.limitPaisa,
                      spentPaisa
                    );

                  const percentage = Math.min(
                    100,
                    Math.max(
                      0,
                      progress.percentage
                    )
                  );

                  return (
                    <div
                      key={budget.id}
                      className="space-y-3 border-b border-border pb-5 last:border-0 last:pb-0"
                    >

                      {/* CATEGORY NAME */}

                      <div className="flex flex-wrap items-start justify-between gap-2">

                        <div className="min-w-0">

                          <p className="text-sm font-semibold">
                            {getCategoryName(
                              budget.categoryId
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatNpr(
                              spentPaisa
                            )}{" "}
                            spent of{" "}
                            {formatNpr(
                              budget.limitPaisa
                            )}
                          </p>

                        </div>

                        <span
                          className={
                            progress.isOverBudget
                              ? "text-xs font-semibold text-destructive"
                              : "text-xs font-semibold text-muted-foreground"
                          }
                        >
                          {progress.percentage.toFixed(
                            0
                          )}
                          %
                        </span>

                      </div>

                      {/* PROGRESS BAR */}

                      <div
                        role="progressbar"
                        aria-label={`${getCategoryName(
                          budget.categoryId
                        )} budget used`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(
                          percentage
                        )}
                        aria-valuetext={`${progress.percentage.toFixed(
                          0
                        )} percent of budget used`}
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                      >

                        <div
                          className={`h-full rounded-full transition-[width] duration-300 ${
                            progress.isOverBudget
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      {/* REMAINING AND ACTIONS */}

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <p
                          className={
                            progress.isOverBudget
                              ? "text-xs text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {progress.isOverBudget
                            ? `${formatNpr(
                                -progress.remainingPaisa
                              )} over budget`
                            : `${formatNpr(
                                progress.remainingPaisa
                              )} remaining`}
                        </p>

                        <div className="flex items-center gap-2">

                          {/* EDIT BUTTON */}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              editBudget(
                                budget
                              )
                            }
                          >
                            Edit
                          </Button>

                          {/* DELETE BUTTON */}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Remove budget for ${getCategoryName(
                              budget.categoryId
                            )}`}
                            onClick={() =>
                              deleteBudget(
                                budget
                              )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                          </Button>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

      </div>

      {/* STORAGE ERRORS */}

      {(storageProblem || saveProblem) && (

        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {storageProblem || saveProblem}
        </p>

      )}

      {/* INFORMATION FOOTER */}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Budgets are saved locally in this browser
        and are specific to each calendar month.
        Only expense transactions count toward
        budgets; internal transfers are excluded.
        Export budgets separately because the
        existing Settings backup may not include
        them yet.
      </p>

    </div>
  );
}
