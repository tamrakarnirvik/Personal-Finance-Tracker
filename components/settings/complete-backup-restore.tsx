
"use client";

import {
  useState,
  type ChangeEvent,
} from "react";

import {
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";

import { isMonthlyBudget } from "@/lib/budget-planning";

import {
  COMPLETE_BACKUP_KEYS,
  getCompleteBackupPreview,
  validateCompleteBackup,
  type CompleteBackupData,
} from "@/lib/complete-backup-validation";

import {
  restoreCompleteBackup,
} from "@/lib/complete-backup-restore";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ==========================================
// DOWNLOAD A JSON FILE
// ==========================================

function downloadJson(
  value: unknown,
  filename: string
) {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

// ==========================================
// MAIN RESTORE COMPONENT
// ==========================================

export function CompleteBackupRestore() {
  const {
    accounts,
    transactions,
  } = useTransactions();

  const {
    categories,
    isCustomCategory,
  } = useCategories();

  const [backup, setBackup] =
    useState<CompleteBackupData | null>(null);

  const [filename, setFilename] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [
    recoveryDownloaded,
    setRecoveryDownloaded,
  ] = useState(false);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const preview = backup
    ? getCompleteBackupPreview(backup)
    : null;

  // ========================================
  // READ AND VALIDATE THE SELECTED FILE
  // ========================================

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    setBackup(null);
    setFilename("");
    setConfirmation("");
    setRecoveryDownloaded(false);
    setError("");
    setNotice("");

    if (!file) return;

    setFilename(file.name);

    if (file.size > MAX_FILE_BYTES) {
      setError(
        "Choose a complete backup smaller than 10 MB."
      );
      return;
    }

    try {
      const raw = await file.text();

      const parsed: unknown =
        JSON.parse(raw);

      const validBackup =
        validateCompleteBackup(parsed);

      setBackup(validBackup);

      setNotice(
        "Backup passed structural and financial validation. Nothing has been restored."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Backup file is invalid."
      );
    }
  }

  // ========================================
  // DOWNLOAD CURRENT-DATA RECOVERY COPY
  // ========================================

  function downloadRecoveryCopy() {
    setError("");
    setNotice("");

    try {
      const rawBudgets =
        window.localStorage.getItem(
          COMPLETE_BACKUP_KEYS.budgets
        );

      const parsedBudgets: unknown =
        rawBudgets
          ? JSON.parse(rawBudgets)
          : [];

      if (
        !Array.isArray(parsedBudgets) ||
        !parsedBudgets.every(isMonthlyBudget)
      ) {
        throw new Error(
          "Current budget storage is unreadable. Restore is disabled to avoid data loss."
        );
      }

      const customCategories =
        categories.filter(
          (category) =>
            isCustomCategory(category.id)
        );

      // Create a recovery copy using live records.

      const recovery = {
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

        storage: {
          [COMPLETE_BACKUP_KEYS.accounts]:
            JSON.stringify(accounts),

          [COMPLETE_BACKUP_KEYS.transactions]:
            JSON.stringify(transactions),

          [COMPLETE_BACKUP_KEYS.customCategories]:
            JSON.stringify(customCategories),

          [COMPLETE_BACKUP_KEYS.budgets]:
            JSON.stringify(parsedBudgets),
        },
      };

      // Ensure the recovery copy is restorable.

      validateCompleteBackup(recovery);

      const stamp = new Date()
        .toISOString()
        .slice(0, 10);

      downloadJson(
        recovery,
        `expense-tracker-before-restore-${stamp}.json`
      );

      setRecoveryDownloaded(true);

      setNotice(
        "Recovery download started. Verify the JSON file is saved before continuing."
      );
    } catch (caught) {
      setRecoveryDownloaded(false);

      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the recovery copy."
      );
    }
  }

  // ========================================
  // CONFIRM AND PERFORM RESTORE
  // ========================================

  function performRestore() {
    if (
      !backup ||
      !recoveryDownloaded ||
      confirmation !== "RESTORE"
    ) {
      return;
    }

    setError("");

    const confirmed = window.confirm(
      "This will REPLACE your current accounts, transactions, custom categories and budgets. " +
      "Confirm that you saved the recovery download. Continue?"
    );

    if (!confirmed) return;

    try {
      restoreCompleteBackup(
        backup,
        window.localStorage
      );

      // Reload all finance providers so that
      // restored values appear throughout the app.

      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The restore was unsuccessful."
      );
    }
  }

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <section
      aria-label="Complete backup restore"
      className="clean-panel space-y-6 p-5 sm:p-6"
    >
      {/* HEADING */}

      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <RotateCcw
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Restore Complete Backup
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Import a backup containing accounts,
            transactions, categories and budgets.
            Existing saved records will be replaced
            only after confirmation.
          </p>
        </div>
      </div>

      {/* RESTORE WARNING */}

      <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <p>
            Restoration replaces your local financial
            data. Close other Expense Tracker tabs
            first. Backups created with the older{" "}
            <strong>Export JSON Backup</strong>{" "}
            button are not supported here.
          </p>
        </div>
      </div>

      {/* SELECT BACKUP */}

      <div className="space-y-2">
        <label
          htmlFor="restore-complete-file"
          className="block text-sm font-medium"
        >
          Select complete backup JSON
        </label>

        <input
          id="restore-complete-file"
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          className="block w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
        />

        {filename && (
          <p className="truncate text-xs text-muted-foreground">
            {filename}
          </p>
        )}
      </div>

      {/* BACKUP PREVIEW */}

      {preview && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck
              size={18}
              className="text-primary"
            />
            Backup validated — ready to review
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Accounts", preview.accounts],
              ["Transactions", preview.transactions],
              ["Categories", preview.categories],
              ["Budgets", preview.budgets],
            ].map(([label, count]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">
                  {label}
                </p>

                <p className="mt-1 font-semibold tabular-nums">
                  {count}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Exported:{" "}
            {new Date(
              preview.exportedAt
            ).toLocaleString("en-GB")}
          </p>
        </div>
      )}

      {/* RESTORE CONTROLS */}

      {backup && (
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">
            Before restoring
          </p>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Download a recovery copy of the records
            currently in this browser. Check that
            the downloaded file exists before
            proceeding.
          </p>

          {/* DOWNLOAD RECOVERY COPY */}

          <Button
            type="button"
            variant="outline"
            onClick={downloadRecoveryCopy}
          >
            <Download size={16} />
            Download current-data recovery copy
          </Button>

          {/* CONFIRMATION INPUT */}

          <div className="space-y-2">
            <label
              htmlFor="restore-confirmation"
              className="block text-sm font-medium"
            >
              Type RESTORE to confirm replacement
            </label>

            <input
              id="restore-confirmation"
              type="text"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value)
              }
              autoComplete="off"
              placeholder="RESTORE"
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* RESTORE BUTTON */}

          <Button
            type="button"
            variant="destructive"
            disabled={
              !recoveryDownloaded ||
              confirmation !== "RESTORE"
            }
            onClick={performRestore}
          >
            <Upload size={16} />
            Restore and replace current data
          </Button>
        </div>
      )}

      {/* STATUS MESSAGES */}

      {notice && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          {notice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </section>
  );
}
