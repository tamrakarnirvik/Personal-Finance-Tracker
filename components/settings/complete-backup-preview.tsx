
"use client";

import {
  useState,
  type ChangeEvent,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  ShieldCheck,
  Upload,
} from "lucide-react";

import {
  getCompleteBackupPreview,
  validateCompleteBackup,
  type CompleteBackupPreview,
} from "@/lib/complete-backup-validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function CompleteBackupPreviewPanel() {
  const [preview, setPreview] =
    useState<CompleteBackupPreview | null>(null);

  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setPreview(null);
    setError("");
    setFileName("");

    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    if (file.size > MAX_FILE_SIZE) {
      setError("The backup file exceeds the 10 MB limit.");
      return;
    }

    try {
      const text = await file.text();

      const parsed: unknown = JSON.parse(text);

      const backup = validateCompleteBackup(parsed);

      const result = getCompleteBackupPreview(backup);

      setPreview(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to read this backup file."
      );
    }
  }

  const details = preview
    ? [
        { label: "Accounts", value: preview.accounts },
        { label: "Transactions", value: preview.transactions },
        { label: "Categories", value: preview.categories },
        { label: "Monthly budgets", value: preview.budgets },
      ]
    : [];

  return (
    <section
      aria-label="Complete backup validation"
      className="clean-panel space-y-5 p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <FileJson size={21} strokeWidth={1.8} />
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Validate a Backup
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Select a complete Expense Tracker JSON backup
            to inspect its contents before restoring.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="complete-backup-file"
          className="block text-sm font-medium"
        >
          Select backup file
        </label>

        <input
          id="complete-backup-file"
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="block w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-primary"
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Validation only. Selecting a file will not change,
          overwrite or delete your current financial records.
        </p>
      </div>

      {fileName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload size={16} />
          <span className="min-w-0 truncate">{fileName}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && (
        <div className="space-y-5">
          <div
            role="status"
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 size={19} />
            Backup structure validated
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-muted/40 p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {item.label}
                </p>

                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Exported:{" "}
            {new Date(preview.exportedAt).toLocaleString(
              "en-GB"
            )}
          </p>

          <p className="text-xs leading-relaxed text-muted-foreground">
            The backup has the required sections and readable
            storage snapshots. Detailed financial integrity
            checks are still required before restoration.
          </p>
        </div>
      )}
    </section>
  );
}
