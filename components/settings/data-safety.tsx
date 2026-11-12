
"use client";

import { useMemo, useState } from "react";
import {
  Download,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";

import { auditFinanceData } from "@/lib/finance-integrity";

export function DataSafety() {
  const { accounts, transactions } = useTransactions();

  const { categories, isCustomCategory } = useCategories();

  const [exportError, setExportError] = useState("");

  // Review existing financial records.
  const issues = useMemo(
    () => auditFinanceData(accounts, transactions, categories),
    [accounts, transactions, categories]
  );

  const errorCount = issues.filter(
    (issue) => issue.severity === "error"
  ).length;

  const warningCount = issues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  // Export current finance data as a JSON file.
  function exportBackup() {
    setExportError("");

    try {
      const customCategories = categories.filter(
        (category) => isCustomCategory(category.id)
      );

      const backup = {
        format: "expense-tracker-backup",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        accounts,
        transactions,
        customCategories,
      };

      const json = JSON.stringify(backup, null, 2);

      const blob = new Blob([json], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `expense-tracker-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      // Release the temporary download URL.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Could not create a backup."
      );
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-6">
        {/* Section heading */}
        <div>
          <h2 className="text-lg font-semibold">
            Data Safety
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review your financial records and download
            a personal backup.
          </p>
        </div>

        {/* Data integrity status */}
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-start gap-3">
            {issues.length === 0 ? (
              <ShieldCheck
                size={22}
                className="shrink-0 text-emerald-600"
              />
            ) : (
              <TriangleAlert
                size={22}
                className="shrink-0 text-amber-600"
              />
            )}

            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {issues.length === 0
                  ? "No integrity issues detected"
                  : "Financial review needed"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {errorCount} errors · {warningCount} warnings
              </p>
            </div>
          </div>

          {/* Display audit findings */}
          {issues.length > 0 && (
            <ul className="mt-4 space-y-2">
              {issues.map((issue) => (
                <li
                  key={issue.id}
                  className="text-sm text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={
                      issue.severity === "error"
                        ? "font-semibold text-red-600"
                        : "font-semibold text-amber-600"
                    }
                  >
                    {issue.severity === "error"
                      ? "Error:"
                      : "Warning:"}
                  </span>{" "}
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Backup details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Backup Your Data
          </h3>

          <p className="text-sm text-slate-500">
            Export a copy of your financial data before
            making major changes or moving to a database.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">
                Accounts
              </p>
              <p className="mt-1 text-xl font-semibold">
                {accounts.length}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">
                Transactions
              </p>
              <p className="mt-1 text-xl font-semibold">
                {transactions.length}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">
                Custom Categories
              </p>
              <p className="mt-1 text-xl font-semibold">
                {categories.filter(
                  (category) =>
                    isCustomCategory(category.id)
                ).length}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={exportBackup}
            className="gap-2"
          >
            <Download size={16} />
            Export JSON Backup
          </Button>

          {exportError && (
            <p
              role="alert"
              className="text-sm text-red-600"
            >
              {exportError}
            </p>
          )}

          <p className="text-xs text-slate-500">
            Your backup is downloaded to your device.
            Keep it private and secure. This version
            supports export only, not import or restore.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
