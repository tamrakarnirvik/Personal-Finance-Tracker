
"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  FileText,
  Printer,
  SlidersHorizontal,
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
  useLocalDay,
} from "@/components/recurring/recurring-automation-store";

import {
  formatNpr,
} from "@/lib/finance";

import {
  buildFinancialReport,
  getReportPresetRange,
  type FinancialReport,
  type ReportFilters,
  type ReportPreset,
  type ReportTypeFilter,
} from "@/lib/finance-reporting";

import {
  buildFinanceCsv,
  buildPrintableFinancialReportHtml,
  financeExportFilename,
  type FinanceCsvKind,
} from "@/lib/finance-report-export";

// ==========================================
// STYLE CONSTANT
// ==========================================

const field =
  "h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

type PeriodChoice =
  | ReportPreset
  | "custom";

type CategoryView =
  | "expense"
  | "income";

// ==========================================
// FINANCIAL METRIC
// ==========================================

function Metric({
  label,
  paisa,
  icon: Icon,
}: {
  label: string;
  paisa: number;
  icon: typeof ArrowDownLeft;
}) {
  return (
    <div className="clean-panel min-w-0 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <Icon
          size={17}
          className="text-muted-foreground"
        />
      </div>

      <p className="mt-3 break-words text-xl font-semibold tabular-nums sm:text-2xl">
        {formatNpr(paisa)}
      </p>
    </div>
  );
}

// ==========================================
// REPORTS WORKSPACE
// ==========================================

export function ReportsWorkspace() {
  const {
    accounts,
    transactions,
  } = useTransactions();

  const {
    categories,
  } = useCategories();

  const today = useLocalDay();

  // ========================================
  // FILTER STATE
  // ========================================

  const [
    period,
    setPeriod,
  ] = useState<PeriodChoice>(
    "this-month"
  );

  const [
    customFrom,
    setCustomFrom,
  ] = useState("");

  const [
    customTo,
    setCustomTo,
  ] = useState("");

  const [
    type,
    setType,
  ] = useState<ReportTypeFilter>(
    "all"
  );

  const [
    accountId,
    setAccountId,
  ] = useState("");

  const [
    categoryId,
    setCategoryId,
  ] = useState("");

  const [
    categoryView,
    setCategoryView,
  ] = useState<CategoryView>(
    "expense"
  );

  const [
    showMore,
    setShowMore,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  // ========================================
  // CALCULATE DATE RANGE
  // ========================================

  const range = useMemo(() => {
    if (period === "custom") {
      return {
        fromDate: customFrom,
        toDate: customTo,
      };
    }

    return today
      ? getReportPresetRange(
          period,
          today
        )
      : {
          fromDate: "",
          toDate: "",
        };
  }, [
    period,
    today,
    customFrom,
    customTo,
  ]);

  // ========================================
  // BUILD REPORT FILTERS
  // ========================================

  const filters: ReportFilters = useMemo(
    () => ({
      ...range,
      accountId,
      categoryId,
      type,
    }),
    [
      range,
      accountId,
      categoryId,
      type,
    ]
  );

  // ========================================
  // GENERATE REPORT
  // ========================================

  const result = useMemo(
    (): {
      report: FinancialReport | null;
      error: string;
    } => {
      if (
        !filters.fromDate ||
        !filters.toDate
      ) {
        return {
          report: null,

          error: today
            ? "Select both custom dates."
            : "",
        };
      }

      try {
        return {
          report: buildFinancialReport({
            transactions,
            accounts,
            categories,
            filters,
          }),

          error: "",
        };
      } catch (error) {
        return {
          report: null,

          error:
            error instanceof Error
              ? error.message
              : "Unable to generate report.",
        };
      }
    },
    [
      transactions,
      accounts,
      categories,
      filters,
      today,
    ]
  );

  const report = result.report;

  // ========================================
  // CATEGORY SUMMARY
  // ========================================

  const byCategory =
    categoryView === "expense"
      ? report?.expenseCategories ?? []
      : report?.incomeCategories ?? [];

  const maxCategoryAmount = Math.max(
    1,
    ...byCategory.map(
      (row) => row.amountPaisa
    )
  );

  // ========================================
  // MONTHLY SUMMARY
  // ========================================

  const monthlyPreview =
    report?.monthly.slice(-12) ?? [];

  const maxMonthAmount = Math.max(
    1,
    ...monthlyPreview.map(
      (row) =>
        Math.max(
          row.incomePaisa,
          row.expensePaisa
        )
    )
  );

  // ========================================
  // TRANSACTION STATEMENT
  // ========================================

  const shownRows =
    report?.rows.slice(
      0,
      showMore ? 250 : 12
    ) ?? [];

  // ========================================
  // CHANGE REPORTING PERIOD
  // ========================================

  function selectPeriod(
    value: PeriodChoice
  ) {
    if (
      value === "custom" &&
      period !== "custom"
    ) {
      const from =
        range.fromDate || today;

      const to =
        range.toDate || today;

      setCustomFrom(from);
      setCustomTo(to);
    }

    setPeriod(value);
    setShowMore(false);
    setActionError("");
  }

  // ========================================
  // DOWNLOAD CSV
  // ========================================

  function downloadCsv(
    kind: FinanceCsvKind
  ) {
    if (!report) return;

    setActionError("");

    try {
      const csv = buildFinanceCsv(
        report,
        kind
      );

      const blob = new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        financeExportFilename(
          report,
          kind
        );

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(url),
        1000
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "CSV export failed."
      );
    }
  }

  // ========================================
  // OPEN PRINTABLE REPORT
  // ========================================

  function openPrintableReport() {
    if (!report) return;

    setActionError("");

    const popup = window.open(
      "",
      "_blank"
    );

    if (!popup) {
      setActionError(
        "Your browser blocked the report tab. Allow pop-ups for this local app and try again."
      );

      return;
    }

    try {
      popup.opener = null;

      popup.document.open();

      popup.document.write(
        buildPrintableFinancialReportHtml(
          report,
          today
        )
      );

      popup.document.close();
      popup.focus();
    } catch {
      popup.close();

      setActionError(
        "Could not open the printable report."
      );
    }
  }

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <div className="space-y-6 pb-8">

      {/* ======================================
          FILTERS
          ====================================== */}

      <section
        aria-label="Financial report filters"
        className="clean-panel space-y-5 p-5 sm:p-6"
      >
        {/* HEADING */}

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <SlidersHorizontal
              size={19}
              className="text-primary"
            />
          </div>

          <div>
            <h2 className="text-base font-semibold">
              Report filters
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose your reporting period,
              transaction type, account and category.
            </p>
          </div>
        </div>

        {/* FILTER CONTROLS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* PERIOD */}

          <div className="space-y-1">
            <label
              htmlFor="report-period"
              className="text-sm font-medium"
            >
              Reporting period
            </label>

            <select
              id="report-period"
              className={field}
              value={period}
              onChange={(event) =>
                selectPeriod(
                  event.target.value as PeriodChoice
                )
              }
            >
              <option value="this-month">
                This month
              </option>

              <option value="last-month">
                Last month
              </option>

              <option value="last-90-days">
                Last 90 days
              </option>

              <option value="this-year">
                This year
              </option>

              <option value="custom">
                Custom range
              </option>
            </select>
          </div>

          {/* TRANSACTION TYPE */}

          <div className="space-y-1">
            <label
              htmlFor="report-type"
              className="text-sm font-medium"
            >
              Transaction type
            </label>

            <select
              id="report-type"
              className={field}
              value={type}
              onChange={(event) => {
                setType(
                  event.target.value as ReportTypeFilter
                );

                setShowMore(false);
              }}
            >
              <option value="all">
                All types
              </option>

              <option value="income">
                Income
              </option>

              <option value="expense">
                Expenses
              </option>

              <option value="transfer">
                Transfers
              </option>
            </select>
          </div>

          {/* ACCOUNT */}

          <div className="space-y-1">
            <label
              htmlFor="report-account"
              className="text-sm font-medium"
            >
              Account
            </label>

            <select
              id="report-account"
              className={field}
              value={accountId}
              onChange={(event) => {
                setAccountId(
                  event.target.value
                );

                setShowMore(false);
              }}
            >
              <option value="">
                All accounts
              </option>

              {accounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORY */}

          <div className="space-y-1">
            <label
              htmlFor="report-category"
              className="text-sm font-medium"
            >
              Category
            </label>

            <select
              id="report-category"
              className={field}
              value={categoryId}
              onChange={(event) => {
                setCategoryId(
                  event.target.value
                );

                setShowMore(false);
              }}
            >
              <option value="">
                All categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                  {" ("}
                  {category.type}
                  {")"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DATE RANGE */}

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="space-y-1">
            <label
              htmlFor="report-from"
              className="text-sm font-medium"
            >
              From date
            </label>

            <input
              id="report-from"
              type="date"
              className={field}
              value={range.fromDate}
              disabled={period !== "custom"}
              onChange={(event) => {
                setCustomFrom(
                  event.target.value
                );

                setShowMore(false);
              }}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="report-to"
              className="text-sm font-medium"
            >
              To date
            </label>

            <input
              id="report-to"
              type="date"
              className={field}
              value={range.toDate}
              disabled={period !== "custom"}
              onChange={(event) => {
                setCustomTo(
                  event.target.value
                );

                setShowMore(false);
              }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Both dates are inclusive.
          A transfer is shown once in the
          statement but excluded from income
          and expense totals.
          {categoryId
            ? " Applying a category filter also excludes transfers."
            : ""}
        </p>
      </section>

      {/* ERRORS */}

      {result.error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
        >
          {result.error}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {!report ? (
        <div className="clean-panel p-6 text-sm text-muted-foreground">
          {today
            ? "Select a valid date range to generate a report."
            : "Loading report dates..."}
        </div>
      ) : (
        <>

          {/* ==================================
              EXPORT CONTROLS
              ================================== */}

          <section
            aria-label="Report export options"
            className="clean-panel space-y-3 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <FileText
                    size={19}
                    className="text-primary"
                  />
                  Financial report
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {range.fromDate}
                  {" to "}
                  {range.toDate}
                  {" · "}
                  {report.transactionCount}
                  {" recorded transactions"}
                </p>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={openPrintableReport}
              >
                <Printer size={16} />
                Print / Save as PDF
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  downloadCsv("transactions")
                }
              >
                <Download size={15} />
                Transactions CSV
              </Button>

              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  downloadCsv("monthly")
                }
              >
                <Download size={15} />
                Monthly CSV
              </Button>

              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() =>
                  downloadCsv("categories")
                }
              >
                <Download size={15} />
                Categories CSV
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Exports are created in your browser.
              The PDF option opens a printable
              report in a new tab; choose
              &ldquo;Save as PDF&rdquo; in the print dialog.
            </p>
          </section>

          {/* ==================================
              FINANCIAL SUMMARY
              ================================== */}

          <section
            aria-label="Financial report summary"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <Metric
              label="Income"
              paisa={report.incomePaisa}
              icon={ArrowDownLeft}
            />

            <Metric
              label="Expenses"
              paisa={report.expensePaisa}
              icon={ArrowUpRight}
            />

            <Metric
              label="Net cash flow"
              paisa={report.netPaisa}
              icon={ArrowLeftRight}
            />

            <Metric
              label="Transfer volume"
              paisa={report.transferVolumePaisa}
              icon={ArrowLeftRight}
            />
          </section>

          {/* ==================================
              MONTHLY COMPARISON
              ================================== */}

          <section
            aria-label="Monthly report summary"
            className="clean-panel space-y-4 p-5 sm:p-6"
          >
            <div>
              <h2 className="text-base font-semibold">
                Monthly income vs. expenses
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                The latest 12 months with activity
                in this date range. Monthly CSV
                includes every matching month.
              </p>
            </div>

            {monthlyPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions in this period.
              </p>
            ) : (
              <div className="space-y-4">
                {monthlyPreview.map((item) => (
                  <div
                    key={item.month}
                    className="grid items-center gap-2 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)]"
                  >
                    <p className="text-xs font-medium">
                      {item.month}
                    </p>

                    {/* INCOME BAR */}

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Income{" "}
                        {formatNpr(
                          item.incomePaisa
                        )}
                      </p>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width:
                              `${
                                item.incomePaisa /
                                maxMonthAmount *
                                100
                              }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* EXPENSE BAR */}

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Expenses{" "}
                        {formatNpr(
                          item.expensePaisa
                        )}
                      </p>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{
                            width:
                              `${
                                item.expensePaisa /
                                maxMonthAmount *
                                100
                              }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ==================================
              CATEGORY COMPARISON
              ================================== */}

          <section
            aria-label="Category comparison"
            className="clean-panel space-y-4 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Category comparison
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Share of recorded{" "}
                  {categoryView} in the
                  filtered period.
                </p>
              </div>

              <select
                aria-label="Category comparison type"
                className={
                  field + " sm:w-44"
                }
                value={categoryView}
                onChange={(event) =>
                  setCategoryView(
                    event.target.value as CategoryView
                  )
                }
              >
                <option value="expense">
                  Expenses
                </option>

                <option value="income">
                  Income
                </option>
              </select>
            </div>

            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories match this selection.
              </p>
            ) : (
              <div className="space-y-4">
                {byCategory.map((item) => (
                  <div
                    key={
                      `${item.type}:${item.categoryId}`
                    }
                    className="space-y-2"
                  >
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <p className="font-medium">
                        {item.category}
                        {" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({item.transactionCount})
                        </span>
                      </p>

                      <p className="tabular-nums">
                        {formatNpr(
                          item.amountPaisa
                        )}
                        {" "}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#146B55]"
                        style={{
                          width:
                            `${
                              item.amountPaisa /
                              maxCategoryAmount *
                              100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ==================================
              TRANSACTION STATEMENT
              ================================== */}

          <section
            aria-label="Financial transaction statement"
            className="clean-panel space-y-4 p-5 sm:p-6"
          >
            <div>
              <h2 className="text-base font-semibold">
                Transaction statement
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {report.transactionCount}
                {" matching entries · "}
                Transfers are neutral to
                net cash flow.
              </p>
            </div>

            {shownRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions found.
                Try another period or filter.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">
                        Date
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Type
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Description
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Account
                      </th>

                      <th className="px-3 py-3 font-medium">
                        Category
                      </th>

                      <th className="px-3 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {shownRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-border/70"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-xs">
                          {row.occurredOn}
                        </td>

                        <td className="px-3 py-3 text-xs capitalize">
                          {row.type}
                        </td>

                        <td
                          className="max-w-52 truncate px-3 py-3"
                          title={row.description}
                        >
                          {row.description}
                        </td>

                        <td
                          className="max-w-52 truncate px-3 py-3 text-xs"
                          title={row.account}
                        >
                          {row.account}
                        </td>

                        <td className="px-3 py-3 text-xs">
                          {row.category}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
                          {formatNpr(
                            row.amountPaisa
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SHOW MORE */}

            {report.rows.length > 12 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setShowMore(
                      (current) => !current
                    )
                  }
                >
                  {showMore
                    ? "Show fewer"
                    : "Show more (up to 250)"}
                </Button>

                {report.rows.length > 250 && (
                  <p className="text-xs text-muted-foreground">
                    Download Transactions CSV
                    for all{" "}
                    {report.rows.length} entries.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* DISCLAIMER */}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Reports are calculated from locally
            recorded transactions. They are not
            bank statements or proof of payment.
            Savings-goal allocations do not
            appear here because they do not
            move money.
          </p>
        </>
      )}
    </div>
  );
}
