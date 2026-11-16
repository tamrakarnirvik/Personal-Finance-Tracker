
"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  RefreshCcw,
  ShieldCheck,
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
  useGoals,
} from "@/components/goals/use-goals";

import {
  useRecurringAutomationStore,
} from "@/components/recurring/recurring-automation-store";

import {
  analyzeDataHealth,
} from "@/lib/data-health";

import {
  createCompleteBackupV4,
} from "@/lib/complete-backup-v4";

// ==========================================
// DATA HEALTH COMPONENT
// ==========================================

export function DataHealthPanel() {
  const {
    accounts,
    transactions,
  } = useTransactions();

  const {
    categories,
    isCustomCategory,
  } = useCategories();

  const {
    workspace: goals,
    error: goalsError,
  } = useGoals();

  const {
    schedules,
    error: schedulesError,
  } = useRecurringAutomationStore();

  const [
    backupCheck,
    setBackupCheck,
  ] = useState<
    "idle" | "pass" | "fail"
  >("idle");

  const [
    backupMessage,
    setBackupMessage,
  ] = useState("");

  const [
    lastChecked,
    setLastChecked,
  ] = useState("");

  // ========================================
  // ANALYZE CURRENT DATA
  // ========================================

  const report = useMemo(
    () =>
      analyzeDataHealth({
        accounts,
        transactions,
        categories,
        goals,
        schedules,
        goalsError,
        schedulesError,
      }),
    [
      accounts,
      transactions,
      categories,
      goals,
      schedules,
      goalsError,
      schedulesError,
    ]
  );

  // ========================================
  // CHECK BACKUP READINESS
  // ========================================

  function checkBackup() {
    setBackupCheck("idle");
    setBackupMessage("");

    setLastChecked(
      new Date().toLocaleString(
        "en-GB"
      )
    );

    try {
      const backup =
        createCompleteBackupV4(
          {
            accounts,
            transactions,
            categories,

            customCategories:
              categories.filter(
                (category) =>
                  isCustomCategory(
                    category.id
                  )
              ),
          },

          window.localStorage
        );

      if (backup.version !== 4) {
        throw new Error(
          "Unexpected backup format."
        );
      }

      setBackupCheck("pass");

      setBackupMessage(
        "Complete Backup v4 validation passed. Download a real backup from Settings to protect your data."
      );
    } catch (error) {
      setBackupCheck("fail");

      setBackupMessage(
        error instanceof Error
          ? error.message
          : "Backup validation failed."
      );
    }
  }

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <div className="space-y-6 pb-8">

      {/* DATA HEALTH OVERVIEW */}

      <section className="clean-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={20}
              className="text-primary"
            />

            <h2 className="text-base font-semibold">
              Local data health
            </h2>
          </div>

          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
            {report.status === "healthy"
              ? "No issues detected"
              : report.status === "review"
                ? "Review recommended"
                : "Attention required"}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          Read-only checks of currently loaded
          accounts, transactions, categories,
          goals and recurring schedules.
        </p>

        {/* RECORD COUNTS */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [
              "Accounts",
              report.accountCount,
            ],
            [
              "Transactions",
              report.transactionCount,
            ],
            [
              "Goals",
              report.goalCount,
            ],
            [
              "Recurring",
              report.scheduleCount,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <p className="text-xs text-muted-foreground">
                {label}
              </p>

              <p className="mt-2 text-xl font-semibold tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* HEALTH RESULTS */}

        {report.issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2
              size={18}
              className="text-primary"
            />

            No referential-integrity issues
            were detected in the loaded data.
          </p>
        ) : (
          <div className="space-y-3">
            {report.issues.map(
              (issue) => (
                <article
                  key={issue.code}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-amber-600"
                    />

                    <strong className="text-sm">
                      {issue.title}
                    </strong>

                    <span className="text-xs text-muted-foreground">
                      {issue.count} affected
                      {" · "}
                      {issue.severity}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {issue.explanation}
                  </p>
                </article>
              )
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          A clean report does not guarantee
          that all localStorage data is durable,
          correct or backed up. This page
          never modifies records.
        </p>
      </section>

      {/* BACKUP READINESS */}

      <section className="clean-panel space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <DatabaseBackup
            size={20}
            className="text-primary"
          />

          <h2 className="font-semibold">
            Backup readiness
          </h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Validate the current workspace
          against the existing Complete
          Backup v4 exporter without
          downloading or overwriting anything.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={checkBackup}
            variant="outline"
          >
            <RefreshCcw size={16} />
            Check backup readiness
          </Button>

          <Link
            href="/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            Open Backup &amp; Restore
          </Link>
        </div>

        {backupMessage && (
          <p
            role={
              backupCheck === "fail"
                ? "alert"
                : "status"
            }
            className={`text-sm ${
              backupCheck === "fail"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {backupMessage}
          </p>
        )}

        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Checked: {lastChecked}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Before any restore, save a verified
          recovery JSON file; recovery remains
          best-effort when browser storage
          writes fail.
        </p>
      </section>
    </div>
  );
}
