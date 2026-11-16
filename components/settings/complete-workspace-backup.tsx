
"use client";

import {
  useState,
  type ChangeEvent,
} from "react";

import {
  Download,
  ShieldCheck,
  TriangleAlert,
  Upload,
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
  createCompleteBackupV4,
  restoreBackupWithGoals,
  validateBackupWithGoals,
  type AnyBackupWithGoals,
} from "@/lib/complete-backup-v4";

const MAX_BYTES =
  10 * 1024 * 1024;

// ======================================
// DOWNLOAD A JSON FILE
// ======================================

function downloadJson(
  value: unknown,
  filename: string
) {
  const blob = new Blob(
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
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

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

// ======================================
// BACKUP AND RESTORE COMPONENT
// ======================================

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
  ] = useState<
    AnyBackupWithGoals | null
  >(null);

  const [
    filename,
    setFilename,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
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

  // ====================================
  // CREATE CURRENT WORKSPACE BACKUP
  // ====================================

  function currentBackup() {
    return createCompleteBackupV4(
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
  }

  // ====================================
  // EXPORT COMPLETE BACKUP
  // ====================================

  function exportBackup() {
    setError("");
    setNotice("");

    try {
      downloadJson(
        currentBackup(),

        `expense-tracker-complete-v4-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.json`
      );

      setNotice(
        "Backup download started. Check that the file was saved."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not export backup."
      );
    }
  }

  // ====================================
  // SELECT AND VALIDATE BACKUP
  // ====================================

  async function chooseBackup(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    setSelected(null);
    setFilename("");
    setError("");
    setNotice("");
    setConfirmation("");
    setRecoveryStarted(false);
    setRecoveryVerified(false);

    if (!file) return;

    setFilename(
      file.name
    );

    if (file.size > MAX_BYTES) {
      setError(
        "Backup must be smaller than 10 MB."
      );

      return;
    }

    try {
      const input: unknown =
        JSON.parse(
          await file.text()
        );

      setSelected(
        validateBackupWithGoals(
          input
        )
      );

      setNotice(
        "Backup validated. No records have been changed."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid backup file."
      );
    }
  }

  // ====================================
  // DOWNLOAD RECOVERY COPY
  // ====================================

  function downloadRecovery() {
    setError("");

    try {
      downloadJson(
        currentBackup(),

        `expense-tracker-recovery-v4-${
          new Date()
            .toISOString()
            .slice(0, 10)
        }.json`
      );

      setRecoveryStarted(true);
      setRecoveryVerified(false);

      setNotice(
        "Recovery download started. Verify the JSON file is saved before continuing."
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

  // ====================================
  // RESTORE WORKSPACE
  // ====================================

  function restore() {
    if (
      !selected ||
      !recoveryStarted ||
      !recoveryVerified ||
      confirmation !== "RESTORE"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Replace the current saved workspace? Automatic posting will be disabled. Confirm that your recovery file exists."
    );

    if (!confirmed) return;

    try {
      restoreBackupWithGoals(
        selected,
        window.localStorage
      );

      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Restore failed."
      );
    }
  }

  // ====================================
  // BACKUP PREVIEW
  // ====================================

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
          selected.version !== 1
            ? selected.data.recurring.length
            : "Not included",
        ],
        [
          "Automation",
          selected.version === 3 ||
          selected.version === 4
            ? "Included"
            : "Not included",
        ],
        [
          "Savings goals",
          selected.version === 4
            ? selected.data.goals.goals.length
            : "Not included",
        ],
      ] as const
    : [];

  // ====================================
  // UI
  // ====================================

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
            Complete Data Backup &amp; Restore
          </h2>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Version 4 includes finances, budgets,
          recurring schedules, automation
          preferences and savings goals with
          allocation history.
        </p>
      </div>

      {/* EXPORT */}

      <div className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold">
          Export complete backup
        </h3>

        <p className="text-xs text-muted-foreground">
          Download and protect your private
          JSON file. Nothing is uploaded to
          a server.
        </p>

        <Button
          type="button"
          onClick={exportBackup}
        >
          <Download size={16} />

          Download complete backup
        </Button>
      </div>

      {/* RESTORE */}

      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold">
          Restore from backup
        </h3>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert
            size={17}
            className="shrink-0 text-amber-600"
          />

          Restoring replaces saved records.
          Close other tabs and test with
          disposable data first. Auto-posting
          is disabled after any restore.
        </p>

        <div className="space-y-2">
          <label
            htmlFor="complete-backup-json"
            className="block text-sm font-medium"
          >
            Select a complete backup JSON file
          </label>

          <input
            id="complete-backup-json"
            type="file"
            accept=".json,application/json"
            onChange={chooseBackup}
            className="block w-full rounded-xl border border-input bg-card p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2"
          />

          {filename && (
            <p className="break-all text-xs text-muted-foreground">
              {filename}
            </p>
          )}
        </div>

        {/* VALIDATED PREVIEW */}

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

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {counts.map(
                  ([label, count]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">
                        {label}
                      </p>

                      <p className="text-sm font-semibold tabular-nums">
                        {count}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* OLD BACKUP WARNING */}

            {selected.version < 4 && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Older backups do not include
                savings goals. If goals already
                exist here, restoration will
                be blocked. Create a v4
                recovery copy first.
              </p>
            )}

            {/* RECOVERY COPY */}

            <Button
              type="button"
              variant="outline"
              onClick={downloadRecovery}
            >
              <Download size={16} />

              Download current-data recovery copy
            </Button>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={recoveryVerified}
                disabled={!recoveryStarted}
                onChange={(event) =>
                  setRecoveryVerified(
                    event.target.checked
                  )
                }
              />

              I verified that my recovery JSON
              file was saved to this device.
            </label>

            {/* CONFIRMATION */}

            <div className="space-y-2">
              <label
                htmlFor="complete-restore-typed"
                className="block text-sm font-medium"
              >
                Type RESTORE to replace current data
              </label>

              <input
                id="complete-restore-typed"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value
                  )
                }
                placeholder="RESTORE"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              disabled={
                !recoveryStarted ||
                !recoveryVerified ||
                confirmation !== "RESTORE"
              }
              onClick={restore}
            >
              <Upload size={16} />

              Restore complete backup
            </Button>
          </div>
        )}
      </div>

      {/* ERRORS AND STATUS */}

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
