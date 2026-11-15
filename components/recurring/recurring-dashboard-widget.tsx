
"use client";

import {
  useMemo,
} from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  useLocalDay,
  useRecurringAutomationStore,
} from "@/components/recurring/recurring-automation-store";

import {
  buildRecurringReminders,
} from "@/lib/recurring-reminders";

// ==========================================
// DASHBOARD RECURRING SUMMARY
// ==========================================

export function RecurringDashboardWidget() {
  const {
    transactions,
  } = useTransactions();

  const {
    schedules,
    settings,
    error,
  } = useRecurringAutomationStore();

  const today = useLocalDay();

  // ========================================
  // CALCULATE REMINDERS
  // ========================================

  const reminders = useMemo(
    () =>
      today && !error
        ? buildRecurringReminders({
            today,
            schedules,
            transactions,
            monthsBack: 3,
            daysAhead:
              settings.reminderDaysAhead,
          })
        : [],
    [
      today,
      schedules,
      transactions,
      settings.reminderDaysAhead,
      error,
    ]
  );

  if (!settings.showDashboardWidget) {
    return null;
  }

  const overdue = reminders.filter(
    (item) =>
      item.status === "overdue"
  ).length;

  const dueToday = reminders.filter(
    (item) =>
      item.status === "due-today"
  ).length;

  const upcoming = reminders.filter(
    (item) =>
      item.status === "upcoming"
  ).length;

  return (
    <section
      aria-label="Recurring summary"
      className="clean-panel space-y-4 p-5 sm:p-6"
    >
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock
            size={19}
            className="text-primary"
          />

          <div>
            <h2 className="text-base font-semibold">
              Recurring payments
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Overdue, due today, and next{" "}
              {settings.reminderDaysAhead} days
            </p>
          </div>
        </div>

        <Link
          href="/recurring"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Review schedules
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* STORAGE ERROR */}

      {error ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : (
        <>
          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: "Overdue",
                value: overdue,
              },
              {
                label: "Due today",
                value: dueToday,
              },
              {
                label: "Upcoming",
                value: upcoming,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <p className="text-xs text-muted-foreground">
                  {metric.label}
                </p>

                <p className="mt-2 text-xl font-semibold tabular-nums">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          {/* NO REMINDERS */}

          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unposted recurring entries
              in this reminder window.
            </p>
          ) : (
            <div className="space-y-2">
              {/* NEXT THREE ITEMS */}

              {reminders.slice(0, 3).map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.schedule.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.occurredOn}
                        {" · "}
                        {item.schedule.type}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.status === "overdue"
                        ? "Overdue"
                        : item.status === "due-today"
                          ? "Due today"
                          : "Upcoming"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* FOOTER */}

      <p className="text-xs text-muted-foreground">
        Based on entries recorded in this
        app, not your bank or biller.
      </p>
    </section>
  );
}
