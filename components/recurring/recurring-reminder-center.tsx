
"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import { formatNpr } from "@/lib/finance";

import {
  RECURRING_CHANGE_EVENT,
  RECURRING_STORAGE_KEY,
  getLocalDateKey,
  getRecurringFrequency,
  isRecurringScheduleList,
  type RecurringSchedule,
} from "@/lib/recurring-planning";

import {
  buildRecurringReminders,
  type RecurringReminder,
} from "@/lib/recurring-reminders";

const STORAGE_UNAVAILABLE =
  "__recurring_storage_unavailable__";

// ==========================================
// STORAGE SUBSCRIPTION
// ==========================================

function subscribeToSchedules(
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

function getSchedulesSnapshot():
  string | null {
  try {
    return window.localStorage.getItem(
      RECURRING_STORAGE_KEY
    );
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

function getServerSchedulesSnapshot():
  string | null {
  return null;
}

// ==========================================
// READ SCHEDULES
// ==========================================

function readSchedules(
  snapshot: string | null
): {
  schedules: RecurringSchedule[];
  error: string;
} {
  if (snapshot === null) {
    return {
      schedules: [],
      error: "",
    };
  }

  if (
    snapshot === STORAGE_UNAVAILABLE
  ) {
    return {
      schedules: [],
      error:
        "Browser storage is not available.",
    };
  }

  try {
    const value: unknown =
      JSON.parse(snapshot);

    if (
      !isRecurringScheduleList(value)
    ) {
      throw new Error("Invalid data");
    }

    return {
      schedules: value,
      error: "",
    };
  } catch {
    return {
      schedules: [],
      error:
        "Recurring schedule data could not be read. Posting from reminders is disabled.",
    };
  }
}

// ==========================================
// REFRESH LOCAL DATE
// ==========================================

function subscribeToToday(
  onChange: () => void
) {
  window.addEventListener(
    "focus",
    onChange
  );

  document.addEventListener(
    "visibilitychange",
    onChange
  );

  return () => {
    window.removeEventListener(
      "focus",
      onChange
    );

    document.removeEventListener(
      "visibilitychange",
      onChange
    );
  };
}

function getTodaySnapshot() {
  return getLocalDateKey();
}

function getServerTodaySnapshot() {
  return "";
}

// ==========================================
// STATUS STYLING
// ==========================================

const statusStyles = {
  overdue:
    "bg-amber-500/10 text-amber-800 dark:text-amber-300",

  "due-today":
    "bg-rose-500/10 text-rose-700 dark:text-rose-300",

  upcoming:
    "bg-muted text-muted-foreground",
} as const;

// ==========================================
// MAIN COMPONENT
// ==========================================

export function RecurringReminderCenter() {
  const {
    accounts,
    transactions,
    postRecurringEntry,
  } = useTransactions();

  const {
    categories,
    getCategoryName,
  } = useCategories();

  const raw = useSyncExternalStore(
    subscribeToSchedules,
    getSchedulesSnapshot,
    getServerSchedulesSnapshot
  );

  const today = useSyncExternalStore(
    subscribeToToday,
    getTodaySnapshot,
    getServerTodaySnapshot
  );

  const {
    schedules,
    error: storageError,
  } = useMemo(
    () => readSchedules(raw),
    [raw]
  );

  const [showAll, setShowAll] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  // ========================================
  // CALCULATE REMINDERS
  // ========================================

  const reminders = useMemo(
    () =>
      today
        ? buildRecurringReminders({
            schedules,
            transactions,
            today,
            monthsBack: 3,
            daysAhead: 30,
          })
        : [],
    [schedules, transactions, today]
  );

  const counts = useMemo(
    () => ({
      overdue: reminders.filter(
        (item) =>
          item.status === "overdue"
      ).length,

      today: reminders.filter(
        (item) =>
          item.status === "due-today"
      ).length,

      upcoming: reminders.filter(
        (item) =>
          item.status === "upcoming"
      ).length,
    }),
    [reminders]
  );

  const visibleReminders = showAll
    ? reminders
    : reminders.slice(0, 6);

  const accountById = new Map(
    accounts.map(
      (account) => [
        account.id,
        account,
      ]
    )
  );

  const categoryById = new Map(
    categories.map(
      (category) => [
        category.id,
        category,
      ]
    )
  );

  // ========================================
  // POST A REMINDER
  // ========================================

  function postReminder(
    reminder: RecurringReminder
  ) {
    setActionError("");
    setNotice("");

    if (
      storageError ||
      reminder.status === "upcoming"
    ) {
      return;
    }

    const schedule = reminder.schedule;

    const referenceValid =
      accountById.has(
        schedule.accountId
      ) &&
      categoryById.get(
        schedule.categoryId
      )?.type === schedule.type;

    if (!referenceValid) {
      setActionError(
        `Cannot post "${schedule.name}": its account or category is missing.`
      );
      return;
    }

    if (
      transactions.some(
        (item) => item.id === reminder.id
      )
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Post ${schedule.name} (${formatNpr(
        schedule.amountPaisa
      )}) dated ${reminder.occurredOn}?`
    );

    if (!confirmed) return;

    try {
      const common = {
        accountId: schedule.accountId,
        categoryId: schedule.categoryId,
        amountPaisa: schedule.amountPaisa,
        occurredOn: reminder.occurredOn,
        note:
          schedule.note || schedule.name,
      };

      const entry =
        schedule.type === "income"
          ? {
              ...common,
              type: "income" as const,
            }
          : {
              ...common,
              type: "expense" as const,
            };

      postRecurringEntry(
        entry,
        reminder.id
      );

      setNotice(
        `Posted ${schedule.name} for ${reminder.occurredOn}.`
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to post the entry."
      );
    }
  }

  // ========================================
  // UI
  // ========================================

  return (
    <section
      aria-label="Recurring payment reminders"
      className="clean-panel space-y-5 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock
              size={19}
              className="text-primary"
            />

            <h2 className="text-base font-semibold">
              Payment reminders
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Unposted weekly, monthly and yearly
            occurrences from the last three
            months and next 30 days.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {today
            ? `Today: ${today}`
            : "Loading dates..."}
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            label: "Overdue",
            value: counts.overdue,
          },
          {
            label: "Due today",
            value: counts.today,
          },
          {
            label: "Upcoming",
            value: counts.upcoming,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-xl border border-border bg-muted/30 p-3 sm:p-4"
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

      {/* REMINDER LIST */}

      {storageError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
        >
          {storageError}
        </p>
      ) : reminders.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
          <CheckCircle2
            size={18}
            className="text-primary"
          />
          No unposted recurring entries
          in this reminder window.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleReminders.map(
            (reminder) => {
              const schedule =
                reminder.schedule;

              const referenceValid =
                accountById.has(
                  schedule.accountId
                ) &&
                categoryById.get(
                  schedule.categoryId
                )?.type ===
                  schedule.type;

              const label =
                reminder.status === "overdue"
                  ? `${Math.abs(
                      reminder.daysUntilDue
                    )} day(s) overdue`
                  : reminder.status === "due-today"
                    ? "Due today"
                    : `Due in ${reminder.daysUntilDue} day(s)`;

              return (
                <article
                  key={reminder.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {schedule.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {reminder.occurredOn}
                        {" · "}
                        {getRecurringFrequency(schedule)}
                        {" · "}
                        {getCategoryName(schedule.categoryId)}
                        {" · "}
                        {schedule.type}
                      </p>

                      <p className="mt-2 text-base font-semibold tabular-nums">
                        {formatNpr(
                          schedule.amountPaisa
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusStyles[
                          reminder.status
                        ]
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {accountById.get(
                        schedule.accountId
                      )?.name ??
                        "Missing account"}

                      {!referenceValid
                        ? " · Check account/category"
                        : ""}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant={
                        reminder.status ===
                        "upcoming"
                          ? "outline"
                          : "default"
                      }
                      disabled={
                        reminder.status ===
                          "upcoming" ||
                        !referenceValid
                      }
                      onClick={() =>
                        postReminder(reminder)
                      }
                    >
                      {reminder.status ===
                      "upcoming"
                        ? "Not due yet"
                        : "Post now"}
                    </Button>
                  </div>
                </article>
              );
            }
          )}

          {reminders.length > 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setShowAll(
                  (value) => !value
                )
              }
            >
              {showAll ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}

              {showAll
                ? "Show fewer"
                : `Show all ${reminders.length} reminders`}
            </Button>
          )}
        </div>
      )}

      {counts.overdue > 0 &&
        !storageError && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle
              size={16}
              className="shrink-0 text-amber-600"
            />

            An overdue reminder means no
            transaction with that recurring ID
            was found. It does not prove a bill
            was unpaid outside this app.
          </p>
        )}

      {actionError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {actionError}
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
        Reminders come from locally saved
        schedules and transactions. Nothing is
        posted automatically. Paused schedules
        are excluded.
      </p>
    </section>
  );
}
