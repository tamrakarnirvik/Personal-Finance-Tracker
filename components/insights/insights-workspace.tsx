
"use client";

import { useMemo } from "react";
import Link from "next/link";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartColumnIncreasing,
  Info,
  TrendingUp,
} from "lucide-react";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  useLocalDay,
} from "@/components/recurring/recurring-automation-store";

import {
  formatNpr,
} from "@/lib/finance";

import {
  buildAdvancedInsights,
} from "@/lib/advanced-insights";

// ==========================================
// FORMAT PERCENT CHANGE
// ==========================================

function changeLabel(
  value: number | null
): string {
  if (value === null) {
    return "Not comparable";
  }

  const sign =
    value > 0 ? "+" : "";

  return (
    `${sign}${value.toFixed(1)}%`
  );
}

// ==========================================
// INSIGHT SUMMARY CARD
// ==========================================

function InsightCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="clean-panel min-w-0 p-5">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 wrap-break-word text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

// ==========================================
// ADVANCED INSIGHTS WORKSPACE
// ==========================================

export function InsightsWorkspace() {
  const {
    accounts,
    transactions,
  } = useTransactions();

  const {
    categories,
  } = useCategories();

  const today = useLocalDay();

  // ========================================
  // CALCULATE INSIGHTS
  // ========================================

  const result = useMemo(() => {
    if (!today) {
      return {
        data: null,
        error: "",
      };
    }

    try {
      return {
        data:
          buildAdvancedInsights({
            accounts,
            transactions,
            categories,
            today,
          }),

        error: "",
      };
    } catch (error) {
      return {
        data: null,

        error:
          error instanceof Error
            ? error.message
            : "Cannot calculate insights.",
      };
    }
  }, [
    accounts,
    transactions,
    categories,
    today,
  ]);

  if (result.error) {
    return (
      <p
        role="alert"
        className="text-sm text-destructive"
      >
        {result.error}
      </p>
    );
  }

  if (!result.data) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading insights...
      </p>
    );
  }

  const data = result.data;

  const maxMonthly = Math.max(
    1,
    ...data.months.map(
      (month) =>
        Math.max(
          month.incomePaisa,
          month.expensePaisa
        )
    )
  );

  const maxCategory = Math.max(
    1,
    ...data.topExpenseCategories.map(
      (category) =>
        category.amountPaisa
    )
  );

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <div className="space-y-6 pb-8">

      {/* REPORT PERIOD */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Last 12 completed months:{" "}

          <strong className="text-foreground">
            {data.fromMonth}
            {" to "}
            {data.throughMonth}
          </strong>
        </p>

        <Link
          href="/reports"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open custom reports
        </Link>
      </div>

      {/* MAIN FINANCIAL METRICS */}

      <section
        aria-label="Advanced financial insights summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <InsightCard
          label="12-month income"
          value={formatNpr(
            data.incomePaisa
          )}
          description="Income recorded in completed months"
        />

        <InsightCard
          label="12-month expenses"
          value={formatNpr(
            data.expensePaisa
          )}
          description="Transfers excluded"
        />

        <InsightCard
          label="Net cash flow"
          value={formatNpr(
            data.netPaisa
          )}
          description="Income less expenses"
        />

        <InsightCard
          label="Net-to-income ratio"
          value={
            data.netToIncomePercent === null
              ? "—"
              : `${data.netToIncomePercent.toFixed(1)}%`
          }
          description="Net cash flow divided by recorded income; not a verified savings rate"
        />
      </section>

      {/* MONTH-OVER-MONTH COMPARISONS */}

      <section
        aria-label="Spending change comparisons"
        className="grid gap-3 md:grid-cols-3"
      >
        <InsightCard
          label="Average monthly expenses"
          value={formatNpr(
            data.averageMonthlyExpensePaisa
          )}
          description="12 completed months, including months with no recorded activity"
        />

        <InsightCard
          label="Expense change vs previous month"
          value={changeLabel(
            data.monthOverMonthExpenseChangePercent
          )}
          description={
            `${formatNpr(
              data.previousMonthExpensePaisa
            )} → ${formatNpr(
              data.lastMonthExpensePaisa
            )}`
          }
        />

        <InsightCard
          label="Expense change vs same month last year"
          value={changeLabel(
            data.yearOverYearExpenseChangePercent
          )}
          description={
            `${formatNpr(
              data.yearAgoMonthExpensePaisa
            )} → ${formatNpr(
              data.lastMonthExpensePaisa
            )}`
          }
        />
      </section>

      {/* MONTHLY INCOME / EXPENSE CHART */}

      <section
        aria-label="Twelve month cash flow chart"
        className="clean-panel space-y-4 p-5 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <ChartColumnIncreasing
            size={18}
            className="text-primary"
          />

          <h2 className="font-semibold">
            Monthly income and expenses
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-600" />
            Income
          </span>

          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-500" />
            Expenses
          </span>
        </div>

        <div className="space-y-3">
          {data.months.map(
            (month) => (
              <div
                key={month.month}
                className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-3 text-xs sm:grid-cols-[82px_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <span className="tabular-nums text-muted-foreground">
                  {month.month}
                </span>

                {/* INCOME BAR */}

                <div className="space-y-1">
                  <span className="text-muted-foreground">
                    Income:{" "}
                    {formatNpr(
                      month.incomePaisa
                    )}
                  </span>

                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width:
                          `${
                            month.incomePaisa /
                            maxMonthly *
                            100
                          }%`,
                      }}
                    />
                  </div>
                </div>

                {/* EXPENSE BAR */}

                <div className="col-start-2 space-y-1 sm:col-start-3">
                  <span className="text-muted-foreground">
                    Expenses:{" "}
                    {formatNpr(
                      month.expensePaisa
                    )}
                  </span>

                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{
                        width:
                          `${
                            month.expensePaisa /
                            maxMonthly *
                            100
                          }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* CATEGORIES AND PROJECTION */}

      <section className="grid items-start gap-5 xl:grid-cols-2">

        {/* TOP EXPENSE CATEGORIES */}

        <article
          aria-label="Top expense categories"
          className="clean-panel space-y-4 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <ArrowUpRight
              size={18}
              className="text-primary"
            />

            <h2 className="font-semibold">
              Top expense categories
            </h2>
          </div>

          {data.topExpenseCategories.length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses recorded in this period.
            </p>
          ) : (
            <div className="space-y-4">
              {data.topExpenseCategories.map(
                (category) => (
                  <div
                    key={category.categoryId}
                    className="space-y-2"
                  >
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span>
                        {category.category}
                      </span>

                      <span className="tabular-nums">
                        {formatNpr(
                          category.amountPaisa
                        )}
                        {" · "}
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#146B55]"
                        style={{
                          width:
                            `${
                              category.amountPaisa /
                              maxCategory *
                              100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </article>

        {/* EXPENSE OUTLOOK */}

        <article
          aria-label="Expense projection"
          className="clean-panel space-y-4 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              size={18}
              className="text-primary"
            />

            <h2 className="font-semibold">
              Illustrative expense outlook
            </h2>
          </div>

          {data.projection.length > 0 ? (
            <div className="space-y-3">
              {data.projection.map(
                (point) => (
                  <div
                    key={point.month}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="text-sm">
                      {point.month}
                    </span>

                    <strong className="text-sm tabular-nums">
                      {formatNpr(
                        point.estimatedExpensePaisa
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Insufficient recent expense
              history for an estimate.
            </p>
          )}

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info
              size={16}
              className="mt-0.5 shrink-0"
            />

            {data.projectionExplanation}
          </p>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDownLeft size={15} />
            Forecasts do not create
            transactions or budgets.
          </p>
        </article>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Empty months mean no transactions
        recorded in this application, not proof
        of zero actual activity. These insights
        are descriptive and should not be used
        as financial guarantees.
      </p>
    </div>
  );
}
