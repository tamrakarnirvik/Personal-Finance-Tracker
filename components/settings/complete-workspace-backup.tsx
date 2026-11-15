
"use client";

import {
  useState,
  type ChangeEvent,
} from "react";

import {
  Download,
  ShieldCheck,
  Upload,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  createCompleteBackupV2,
  readBackupExtras,
  restoreSupportedCompleteBackup,
  validateSupportedCompleteBackup,
  type SupportedCompleteBackup,
} from "@/lib/complete-backup-v2";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ==========================================
// DOWNLOAD JSON
// ==========================================

function downloadJson(
  value: unknown,
  filename: string
): void {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          value,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    )
  );

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
// MAIN COMPONENT
// ==========================================

export function CompleteWorkspaceBackup() {
  const {
    accounts,
    transactions,
  } = useTransactions();

  const {
    categories,
    isCustomCategory,
  } = useCategories();

  const [
    selected,
    setSelected,
  ] = useState<SupportedCompleteBackup | null>(
    null
  );

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    confirmation,
    setConfirmation,
  ] = useState("");

  const [
    recoveryStarted,
    setRecoveryStarted,
  ] = useState(false);

  const [
    recoveryVerified,
    setRecoveryVerified,
  ] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ========================================
  // BUILD A COMPLETE BACKUP
  // ========================================

  function buildCurrentBackup() {
    const extras = readBackupExtras(
      window.localStorage
    );

    return createCompleteBackupV2(
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
      extras
    );
  }

  // ========================================
  // EXPORT DATA
  // ========================================

  function exportComplete() {
    setError("");
    setNotice("");

    try {
      const file = buildCurrentBackup();

      downloadJson(
        file,
        `expense-tracker-complete-v2-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.json`
      );

      setNotice(
        "Complete backup download started. Confirm it is in your Downloads folder."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not export data."
      );
    }
  }

  // ========================================
  // SELECT AND VALIDATE BACKUP
  // ========================================

  async function selectBackup(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    setSelected(null);
    setFileName("");
    setConfirmation("");
    setRecoveryStarted(false);
    setRecoveryVerified(false);
    setError("");
    setNotice("");

    if (!file) return;

    setFileName(file.name);

    if (
      file.size > MAX_FILE_BYTES
    ) {
      setError(
        "The JSON file must be smaller than 10 MB."
      );

      return;
    }

    try {
      const input: unknown =
        JSON.parse(
          await file.text()
        );

      const valid =
        validateSupportedCompleteBackup(
          input
        );

      setSelected(valid);

      setNotice(
        "Backup validated. No data has been changed."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid backup file."
      );
    }
  }

  // ========================================
  // DOWNLOAD RECOVERY COPY
  // ========================================

  function downloadRecovery() {
    setError("");

    try {
      const recovery =
        buildCurrentBackup();

      downloadJson(
        recovery,
        `expense-tracker-recovery-v2-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.json`
      );

      setRecoveryStarted(true);
      setRecoveryVerified(false);

      setNotice(
        "Recovery download started. Verify the saved file before confirming."
      );
    } catch (caught) {
      setRecoveryStarted(false);
      setRecoveryVerified(false);

      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create recovery file."
      );
    }
  }

  // ========================================
  // RESTORE
  // ========================================

  function restore() {
    if (
      !selected ||
      !recoveryStarted ||
      !recoveryVerified ||
      confirmation !== "RESTORE"
    ) {
      return;
    }

    setError("");

    const warning =
      selected.version === 1
        ? "This version 1 backup contains no recurring schedules. Restore legacy financial data?"
        : "This will replace accounts, transactions, categories, budgets AND recurring schedules. Continue?";

    if (!window.confirm(warning)) {
      return;
    }

    try {
      restoreSupportedCompleteBackup(
        selected,
        window.localStorage
      );

      // Reload providers after restoration.
      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Restore failed."
      );
    }
  }

  // ========================================
  // BACKUP PREVIEW COUNTS
  // ========================================

  const counts = selected
    ? [
        [
          "Accounts",
          selected.data.accounts.length,
        ],
        [
          "Transactions",
          selected.data.transactions.length,
        ],
        [
          "Categories",
          selected.data.categories.length,
        ],
        [
          "Budgets",
          selected.data.budgets.length,
        ],
        [
          "Recurring",
          selected.version === 2
            ? selected.data.recurring.length
            : "Not included",
        ],
      ]
    : [];

  // ========================================
  // USER INTERFACE
  // ========================================

  return (
    <section
      aria-label="Complete workspace backup"
      className="clean-panel space-y-6 p-5 sm:p-6"
    >
      {/* HEADER */}

      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={20}
            className="text-primary"
          />

          <h2 className="text-lg font-semibold">
            Complete Data Backup & Restore
          </h2>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Version 2 includes accounts,
          transactions, categories, budgets
          and recurring schedules.
        </p>
      </div>

      {/* EXPORT SECTION */}

      <div className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold">
          Export complete data
        </h3>

        <p className="text-xs text-muted-foreground">
          Exports a private JSON file on this
          device. No data is sent to a server.
        </p>

        <div>
          <Button
            type="button"
            onClick={exportComplete}
          >
            <Download size={16} />

            Download complete backup
          </Button>
        </div>
      </div>

      {/* RESTORE SECTION */}

      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold">
          Restore from backup
        </h3>

        {/* WARNING */}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert
            size={17}
            className="shrink-0 text-amber-600"
          />

          <p>
            Restoration replaces saved records.
            Use a separate browser profile for
            your first test, and close other
            Expense Tracker tabs before restoring.
          </p>
        </div>

        {/* FILE SELECTOR */}

        <div className="space-y-2">
          <label
            htmlFor="complete-workspace-file"
            className="block text-sm font-medium"
          >
            Select complete backup JSON
          </label>

          <input
            id="complete-workspace-file"
            type="file"
            accept=".json,application/json"
            onChange={selectBackup}
            className="block w-full rounded-xl border border-input bg-card p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2"
          />

          {fileName && (
            <p className="break-all text-xs text-muted-foreground">
              {fileName}
            </p>
          )}
        </div>

        {/* VALIDATED BACKUP PREVIEW */}

        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-semibold">
                Validated backup · Version{" "}
                {selected.version}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Exported{" "}
                {new Date(
                  selected.exportedAt
                ).toLocaleString("en-GB")}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {counts.map(
                  ([name, count]) => (
                    <div key={name}>
                      <p className="text-xs text-muted-foreground">
                        {name}
                      </p>

                      <p className="text-sm font-semibold tabular-nums">
                        {count}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* LEGACY BACKUP WARNING */}

            {selected.version === 1 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                This older backup cannot
                restore recurring schedules.
                If this browser already has any
                recurring schedules, restoration
                will be blocked to protect them.
              </p>
            )}

            {/* RECOVERY DOWNLOAD */}

            <Button
              type="button"
              variant="outline"
              onClick={downloadRecovery}
            >
              <Download size={16} />

              Download current-data recovery copy
            </Button>

            {/* RECOVERY VERIFICATION */}

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={recoveryVerified}
                disabled={!recoveryStarted}
                onChange={(event) =>
                  setRecoveryVerified(
                    event.target.checked
                  )
                }
                className="mt-1"
              />

              I verified the recovery JSON
              file was saved to my device.
            </label>

            {/* CONFIRMATION INPUT */}

            <div className="space-y-2">
              <label
                htmlFor="complete-restore-confirm"
                className="block text-sm font-medium"
              >
                Type RESTORE to replace current data
              </label>

              <input
                id="complete-restore-confirm"
                autoComplete="off"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value
                  )
                }
                placeholder="RESTORE"
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              />
            </div>

            {/* RESTORE ACTION */}

            <Button
              type="button"
              variant="destructive"
              onClick={restore}
              disabled={
                !recoveryStarted ||
                !recoveryVerified ||
                confirmation !== "RESTORE"
              }
            >
              <Upload size={16} />

              Restore complete backup
            </Button>
          </div>
        )}
      </div>

      {/* STATUS AND ERROR */}

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          {notice}
        </p>
      )}
    </section>
  );
}
