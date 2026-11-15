
"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  CalendarClock,
  Download,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  formatNpr,
  parseNprToPaisa,
} from "@/lib/finance";

import {
  RECURRING_CHANGE_EVENT,
  RECURRING_STORAGE_KEY,
  getLocalDateKey,
  getOccurrencesForMonth,
  getRecurringFrequency,
  isValidDateKey,
  isOccurrencePosted,
  isRecurringScheduleList,
  type RecurringFrequency,
  type RecurringKind,
  type RecurringSchedule,
  type RecurringOccurrence,
} from "@/lib/recurring-planning";

const field =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

const UNAVAILABLE =
  "__recurring_storage_unavailable__";

function subscribe(
  onChange: () => void
) {
  window.addEventListener(
    "storage",
    onChange
  );
  window.addEventListener(
    RECURRING_CHANGE_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      onChange
    );
    window.removeEventListener(
      RECURRING_CHANGE_EVENT,
      onChange
    );
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(
      RECURRING_STORAGE_KEY
    );
  } catch {
    return UNAVAILABLE;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function parseSnapshot(
  raw: string | null
): {
  schedules: RecurringSchedule[];
  error: string;
} {
  if (raw === null) {
    return {
      schedules: [],
      error: "",
    };
  }

  if (raw === UNAVAILABLE) {
    return {
      schedules: [],
      error: "Browser storage is unavailable.",
    };
  }

  try {
    const parsed: unknown =
      JSON.parse(raw);

    if (!isRecurringScheduleList(parsed)) {
      throw new Error("Invalid schedules");
    }

    return {
      schedules: parsed,
      error: "",
    };
  } catch {
    return {
      schedules: [],
      error:
        "Saved recurring schedules are unreadable. Editing has been disabled to protect existing data.",
    };
  }
}

function downloadJson(
  value: unknown,
  filename: string
) {
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify(value, null, 2)],
      { type: "application/json" }
    )
  );

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

export function RecurringManager() {
  const {
    accounts,
    transactions,
    postRecurringEntry,
  } = useTransactions();

  const {
    categories,
    getCategoryName,
  } = useCategories();

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const {
    schedules,
    error: storageError,
  } = useMemo(
    () => parseSnapshot(snapshot),
    [snapshot]
  );

  const today = getLocalDateKey();

  const [monthKey, setMonthKey] =
    useState(
      () => getLocalDateKey().slice(0, 7)
    );

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [name, setName] = useState("");

  const [type, setType] =
    useState<RecurringKind>("expense");

  const [frequency, setFrequency] =
    useState<RecurringFrequency>("monthly");

  const [accountId, setAccountId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [startOn, setStartOn] =
    useState(() => getLocalDateKey());

  const [note, setNote] =
    useState("");

  const [active, setActive] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const availableCategories =
    categories.filter(
      (category) =>
        category.type === type
    );

  const categoryById = new Map(
    categories.map(
      (category) => [
        category.id,
        category,
      ]
    )
  );

  const accountIds = new Set(
    accounts.map(
      (account) => account.id
    )
  );

  // ========================================
  // BUILD ALL OCCURRENCES FOR MONTH
  // ========================================

  const occurrences = schedules
    .flatMap((schedule) =>
      getOccurrencesForMonth(
        schedule,
        monthKey
      ).map((occurrence) => ({
        schedule,
        occurrence,
      }))
    )
    .sort((a, b) =>
      a.occurrence.occurredOn.localeCompare(
        b.occurrence.occurredOn
      )
    );

  const dueCount = occurrences.filter(
    ({ schedule, occurrence }) =>
      schedule.active &&
      occurrence.occurredOn <= today &&
      !isOccurrencePosted(
        occurrence,
        transactions
      )
  ).length;

  const postedCount = occurrences.filter(
    ({ occurrence }) =>
      isOccurrencePosted(
        occurrence,
        transactions
      )
  ).length;

  // ========================================
  // SAVE TO LOCAL STORAGE
  // ========================================

  function writeSchedules(
    next: RecurringSchedule[]
  ): boolean {
    if (storageError) {
      return false;
    }

    try {
      window.localStorage.setItem(
        RECURRING_STORAGE_KEY,
        JSON.stringify(next)
      );

      window.dispatchEvent(
        new Event(
          RECURRING_CHANGE_EVENT
        )
      );

      setError("");
      return true;
    } catch {
      setError(
        "Recurring schedules could not be saved. Check your browser storage."
      );
      return false;
    }
  }

  // ========================================
  // RESET FORM
  // ========================================

  function resetForm() {
    setEditingId(null);
    setName("");
    setType("expense");
    setFrequency("monthly");
    setAccountId("");
    setCategoryId("");
    setAmount("");
    setStartOn(getLocalDateKey());
    setNote("");
    setActive(true);
  }

  // ========================================
  // CREATE OR UPDATE SCHEDULE
  // ========================================

  function saveSchedule(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (storageError) return;

    const trimmedName = name.trim();

    if (
      !trimmedName ||
      trimmedName.length > 80
    ) {
      setError(
        "Enter a name of up to 80 characters."
      );
      return;
    }

    if (!accountIds.has(accountId)) {
      setError(
        "Select an existing account."
      );
      return;
    }

    if (
      categoryById.get(categoryId)?.type !==
      type
    ) {
      setError(
        "Select a matching category."
      );
      return;
    }

    if (note.length > 240) {
      setError(
        "Keep notes within 240 characters."
      );
      return;
    }

    let amountPaisa: number;

    try {
      amountPaisa = parseNprToPaisa(
        amount.trim()
      );

      if (
        !Number.isSafeInteger(amountPaisa) ||
        amountPaisa <= 0
      ) {
        throw new Error();
      }
    } catch {
      setError(
        "Enter a positive NPR amount, such as 2500.00."
      );
      return;
    }

    if (!isValidDateKey(startOn)) {
      setError(
        "Select a valid start date."
      );
      return;
    }

    // Protect posted transactions from being
    // recreated under a changed recurrence rule.

    const oldSchedule = schedules.find(
      (item) => item.id === editingId
    );

    if (
      oldSchedule &&
      (
        oldSchedule.startOn !== startOn ||
        getRecurringFrequency(oldSchedule) !==
          frequency
      ) &&
      transactions.some(
        (item) =>
          item.id.startsWith(
            `recurring:${oldSchedule.id}:`
          ) ||
          item.id.startsWith(
            `recurring:${oldSchedule.id}-wk-`
          )
      )
    ) {
      setError(
        "This schedule already has posted entries. To change its first due date or frequency, pause it and create a new schedule."
      );
      return;
    }

    const schedule: RecurringSchedule = {
      id: editingId ?? crypto.randomUUID(),
      name: trimmedName,
      type,
      accountId,
      categoryId,
      amountPaisa,
      startOn,
      note: note.trim(),
      active,
      frequency,
    };

    const next = editingId
      ? schedules.map((item) =>
          item.id === editingId
            ? schedule
            : item
        )
      : [...schedules, schedule];

    if (writeSchedules(next)) {
      resetForm();

      setNotice(
        "Recurring schedule saved. Entries are posted manually."
      );
    }
  }

  // ========================================
  // EDIT EXISTING SCHEDULE
  // ========================================

  function editSchedule(
    schedule: RecurringSchedule
  ) {
    setEditingId(schedule.id);
    setName(schedule.name);
    setType(schedule.type);

    setFrequency(
      getRecurringFrequency(schedule)
    );

    setAccountId(schedule.accountId);
    setCategoryId(schedule.categoryId);

    setAmount(
      (schedule.amountPaisa / 100).toFixed(2)
    );

    setStartOn(schedule.startOn);
    setNote(schedule.note);
    setActive(schedule.active);

    setNotice("");
    setError("");

    document
      .getElementById("recurring-name")
      ?.focus();
  }

  // ========================================
  // PAUSE OR RESUME
  // ========================================

  function toggleSchedule(
    schedule: RecurringSchedule
  ) {
    setNotice("");

    writeSchedules(
      schedules.map((item) =>
        item.id === schedule.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );
  }

  // ========================================
  // DELETE
  // ========================================

  function removeSchedule(
    schedule: RecurringSchedule
  ) {
    if (
      !window.confirm(
        `Delete the recurring schedule "${schedule.name}"? Previously posted transactions will remain.`
      )
    ) {
      return;
    }

    if (
      writeSchedules(
        schedules.filter(
          (item) => item.id !== schedule.id
        )
      )
    ) {
      if (editingId === schedule.id) {
        resetForm();
      }

      setNotice(
        "Schedule deleted. Existing transactions were not removed."
      );
    }
  }

  // ========================================
  // POST ONE OCCURRENCE
  // ========================================

  function postOccurrence(
    schedule: RecurringSchedule,
    occurrence: RecurringOccurrence
  ) {
    setError("");
    setNotice("");

    if (
      !schedule.active ||
      occurrence.occurredOn >
        getLocalDateKey()
    ) {
      return;
    }

    if (
      isOccurrencePosted(
        occurrence,
        transactions
      )
    ) {
      return;
    }

    if (
      !accountIds.has(schedule.accountId) ||
      categoryById.get(
        schedule.categoryId
      )?.type !== schedule.type
    ) {
      setError(
        `"${schedule.name}" uses a missing account or category. Edit the schedule before posting.`
      );
      return;
    }

    try {
      const common = {
        accountId: schedule.accountId,
        categoryId: schedule.categoryId,
        amountPaisa: schedule.amountPaisa,
        occurredOn: occurrence.occurredOn,
        note: schedule.note || schedule.name,
      };

      const entry =
        schedule.type === "expense"
          ? {
              ...common,
              type: "expense" as const,
            }
          : {
              ...common,
              type: "income" as const,
            };

      postRecurringEntry(
        entry,
        occurrence.id
      );

      setNotice(
        `Posted ${schedule.name} for ${occurrence.occurredOn}.`
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not post this occurrence."
      );
    }
  }

  // ========================================
  // EXPORT SCHEDULES
  // ========================================

  function exportSchedules() {
    downloadJson(
      {
        application: "expense-tracker",
        format: "recurring-schedules",
        version: 1,
        exportedAt: new Date().toISOString(),
        schedules,
      },
      `expense-tracker-recurring-${getLocalDateKey()}.json`
    );
  }

  // ========================================
  // IMPORT SCHEDULES
  // ========================================

  async function importSchedules(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.currentTarget.files?.[0];

    event.currentTarget.value = "";

    if (!file) return;

    setError("");
    setNotice("");

    if (storageError) return;

    if (
      file.size > 5 * 1024 * 1024
    ) {
      setError(
        "Choose a schedules JSON file smaller than 5 MB."
      );
      return;
    }

    try {
      const input: unknown =
        JSON.parse(await file.text());

      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input)
      ) {
        throw new Error("Invalid file.");
      }

      const obj = input as Record<
        string,
        unknown
      >;

      if (
        obj.application !== "expense-tracker" ||
        obj.format !== "recurring-schedules" ||
        obj.version !== 1 ||
        !isRecurringScheduleList(obj.schedules)
      ) {
        throw new Error(
          "This is not a valid recurring schedules export."
        );
      }

      const imported =
        obj.schedules;

      if (
        !window.confirm(
          `Replace all ${schedules.length} current recurring schedules with ${imported.length} schedules from the file? Posted transactions will not change.`
        )
      ) {
        return;
      }

      if (writeSchedules(imported)) {
        resetForm();

        setNotice(
          "Schedules imported. Check account and category selections before posting."
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not import recurring schedules."
      );
    }
  }

  // ========================================
  // COMPONENT UI
  // ========================================

  return (
    <div className="space-y-6 pb-7">

      {/* HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Recurring schedules
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Your recurring schedules
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Review weekly, monthly and yearly occurrences.
            Post each one only once.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="recurring-month"
            className="text-xs font-medium text-muted-foreground"
          >
            View month
          </label>

          <input
            id="recurring-month"
            type="month"
            value={monthKey}
            onChange={(event) => {
              if (
                /^\d{4}-(0[1-9]|1[0-2])$/.test(
                  event.target.value
                )
              ) {
                setMonthKey(event.target.value);
              }
            }}
            className={field}
          />
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Active schedules",
            value: schedules.filter(
              (item) => item.active
            ).length,
          },
          {
            label: "Due to post",
            value: dueCount,
          },
          {
            label: "Posted this month",
            value: postedCount,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="clean-panel p-5"
          >
            <p className="text-xs text-muted-foreground">
              {metric.label}
            </p>

            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">

        {/* SCHEDULE EDITOR */}

        <section
          aria-label="Recurring schedule editor"
          className="clean-panel space-y-5 p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Repeat2
              size={19}
              className="text-primary"
            />

            <h3 className="font-semibold">
              {editingId
                ? "Edit recurring schedule"
                : "New recurring schedule"}
            </h3>
          </div>

          <form
            onSubmit={saveSchedule}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label
                htmlFor="recurring-name"
                className="text-sm font-medium"
              >
                Name
              </label>

              <input
                id="recurring-name"
                className={field}
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Rent, Salary, Internet bill..."
                maxLength={80}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="recurring-frequency"
                  className="text-sm font-medium"
                >
                  Frequency
                </label>

                <select
                  id="recurring-frequency"
                  className={field}
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(
                      event.target.value as RecurringFrequency
                    )
                  }
                >
                  <option value="weekly">
                    Weekly (every 7 days)
                  </option>
                  <option value="monthly">
                    Monthly
                  </option>
                  <option value="yearly">
                    Yearly
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="recurring-type"
                  className="text-sm font-medium"
                >
                  Type
                </label>

                <select
                  id="recurring-type"
                  className={field}
                  value={type}
                  onChange={(event) => {
                    setType(
                      event.target.value as RecurringKind
                    );
                    setCategoryId("");
                  }}
                >
                  <option value="expense">
                    Expense
                  </option>
                  <option value="income">
                    Income
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recurring-start"
                className="text-sm font-medium"
              >
                First due date
              </label>

              <input
                id="recurring-start"
                className={field}
                type="date"
                value={startOn}
                required
                onChange={(event) =>
                  setStartOn(event.target.value)
                }
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recurring-account"
                className="text-sm font-medium"
              >
                Account
              </label>

              <select
                id="recurring-account"
                className={field}
                required
                value={accountId}
                onChange={(event) =>
                  setAccountId(event.target.value)
                }
              >
                <option value="">
                  Select account
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

            <div className="space-y-1">
              <label
                htmlFor="recurring-category"
                className="text-sm font-medium"
              >
                Category
              </label>

              <select
                id="recurring-category"
                className={field}
                required
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
              >
                <option value="">
                  Select category
                </option>

                {availableCategories.map(
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

            <div className="space-y-1">
              <label
                htmlFor="recurring-amount"
                className="text-sm font-medium"
              >
                Amount (NPR)
              </label>

              <input
                id="recurring-amount"
                className={field}
                required
                inputMode="decimal"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="2500.00"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recurring-note"
                className="text-sm font-medium"
              >
                Note (optional)
              </label>

              <input
                id="recurring-note"
                className={field}
                value={note}
                maxLength={240}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Reference or description"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  setActive(event.target.checked)
                }
              />
              Active schedule
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={Boolean(storageError)}
              >
                <Plus size={16} />
                {editingId
                  ? "Update schedule"
                  : "Save schedule"}
              </Button>

              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </section>

        {/* OCCURRENCE LIST */}

        <section
          aria-label="Monthly recurring occurrences"
          className="clean-panel min-w-0 space-y-5 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock
                size={19}
                className="text-primary"
              />

              <h3 className="font-semibold">
                Occurrences in selected month
              </h3>
            </div>

            <Link
              href="/transactions"
              className="text-xs font-medium text-primary hover:underline"
            >
              View transactions
            </Link>
          </div>

          {occurrences.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No schedules for the selected month.
            </p>
          ) : (
            <div className="space-y-4">
              {occurrences.map(
                ({ schedule, occurrence }) => {
                  const posted =
                    isOccurrencePosted(
                      occurrence,
                      transactions
                    );

                  const due =
                    schedule.active &&
                    occurrence.occurredOn <= today &&
                    !posted;

                  const validReferences =
                    accountIds.has(
                      schedule.accountId
                    ) &&
                    categoryById.get(
                      schedule.categoryId
                    )?.type === schedule.type;

                  const label = posted
                    ? "Posted"
                    : !schedule.active
                      ? "Paused"
                      : due
                        ? "Due"
                        : "Upcoming";

                  return (
                    <article
                      key={occurrence.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold">
                            {schedule.name}
                          </h4>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {occurrence.occurredOn}
                            {" · "}
                            {getRecurringFrequency(schedule)}
                            {" · "}
                            {getCategoryName(schedule.categoryId)}
                            {" · "}
                            {schedule.type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            posted
                              ? "bg-primary/10 text-primary"
                              : due
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {label}
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-semibold tabular-nums">
                        {formatNpr(schedule.amountPaisa)}
                      </p>

                      {!validReferences && (
                        <p className="mt-2 text-xs text-destructive">
                          Missing account or category.
                          Edit this schedule.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            postOccurrence(
                              schedule,
                              occurrence
                            )
                          }
                          disabled={
                            !due ||
                            !validReferences ||
                            Boolean(storageError)
                          }
                        >
                          {posted
                            ? "Already posted"
                            : "Post entry"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            editSchedule(schedule)
                          }
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toggleSchedule(schedule)
                          }
                          disabled={Boolean(storageError)}
                        >
                          {schedule.active
                            ? "Pause"
                            : "Resume"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Delete schedule ${schedule.name}`}
                          onClick={() =>
                            removeSchedule(schedule)
                          }
                          disabled={Boolean(storageError)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {/* SCHEDULE BACKUP */}

      <section
        aria-label="Recurring schedule backup"
        className="clean-panel space-y-3 p-5 sm:p-6"
      >
        <h3 className="text-sm font-semibold">
          Back up recurring schedules
        </h3>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Recurring schedules are included in
          Complete Backup v2. You can also
          export them separately.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={exportSchedules}
            disabled={Boolean(storageError)}
          >
            <Download size={15} />
            Export schedules
          </Button>

          <label
            htmlFor="recurring-import"
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Upload size={15} />
            Import schedules
          </label>

          <input
            id="recurring-import"
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={importSchedules}
            disabled={Boolean(storageError)}
          />
        </div>
      </section>

      {(storageError || error) && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 p-3 text-sm text-destructive"
        >
          {storageError || error}
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

      <p className="text-xs leading-relaxed text-muted-foreground">
        Entries are posted manually. Editing
        or deleting a schedule does not change
        previously posted transactions. If a
        posted transaction is deleted, that
        occurrence can become eligible again.
      </p>
    </div>
  );
}
