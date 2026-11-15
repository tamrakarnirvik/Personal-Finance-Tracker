
"use client";

import { useState } from "react";
import {
  DatabaseBackup,
  Download,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";

import {
  BUDGET_STORAGE_KEY,
  isMonthlyBudget,
} from "@/lib/budget-planning";

const STORAGE_KEYS = {
  transactions: "expense-tracker-transactions-v1",
  accounts: "expense-tracker-accounts-v1",
  customCategories:
    "expense-tracker-custom-categories-v1",
  budgets: BUDGET_STORAGE_KEY,
};

export function CompleteBackupExport() {
  const { accounts, transactions } = useTransactions();
  const { categories } = useCategories();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function downloadBackup() {
    setError("");
    setSuccess("");

    try {
      // Capture the original stored data exactly.
      // Null means no record exists for that key.
      const storage = {
        [STORAGE_KEYS.transactions]:
          window.localStorage.getItem(
            STORAGE_KEYS.transactions
          ),

        [STORAGE_KEYS.accounts]:
          window.localStorage.getItem(
            STORAGE_KEYS.accounts
          ),

        [STORAGE_KEYS.customCategories]:
          window.localStorage.getItem(
            STORAGE_KEYS.customCategories
          ),

        [STORAGE_KEYS.budgets]:
          window.localStorage.getItem(
            STORAGE_KEYS.budgets
          ),
      };

      // Read and validate stored budget records.
      const savedBudgets = storage[
        STORAGE_KEYS.budgets
      ];

      const parsedBudgets: unknown =
        savedBudgets === null
          ? []
          : JSON.parse(savedBudgets);

      if (
        !Array.isArray(parsedBudgets) ||
        !parsedBudgets.every(isMonthlyBudget)
      ) {
        throw new Error(
          "Stored budget data is invalid. The backup was not created."
        );
      }

      // Include both the live financial records
      // and the original storage snapshots.
      //
      // Original snapshots preserve custom category
      // storage and support future restore integration.

      const backup = {
        application: "expense-tracker",
        format: "complete-workspace-backup",
        version: 1,
        exportedAt: new Date().toISOString(),

        data: {
          accounts,
          transactions,
          categories,
          budgets: parsedBudgets,
        },

        storage,
      };

      const json = JSON.stringify(
        backup,
        null,
        2
      );

      const blob = new Blob(
        [json],
        {
          type: "application/json",
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;

      link.download =
        `expense-tracker-complete-backup-${date}.json`;

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      setSuccess(
        "Complete backup downloaded successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the backup."
      );
    }
  }

  return (
    <section
      aria-label="Complete data backup"
      className="clean-panel p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <DatabaseBackup
              size={21}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Complete Data Backup
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Download your financial workspace
              as one JSON file, including accounts,
              transactions, categories, and monthly
              budgets.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            Financial records
          </p>

          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {transactions.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Transactions included
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            Financial accounts
          </p>

          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {accounts.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Accounts included
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck
          size={16}
          className="mt-0.5 shrink-0 text-primary"
        />

        <p>
          Your backup is generated inside your
          browser. Keep the downloaded file in a
          secure location because it contains
          your financial information.
        </p>
      </div>

      <div className="mt-6">
        <Button
          type="button"
          onClick={downloadBackup}
        >
          <Download size={17} />
          Download complete backup
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mt-4 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {success}
        </p>
      )}
    </section>
  );
}
