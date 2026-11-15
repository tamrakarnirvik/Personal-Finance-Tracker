
import {
  getOccurrencesForMonth,
  isOccurrencePosted,
  isValidDateKey,
  type RecurringOccurrence,
  type RecurringSchedule,
} from "@/lib/recurring-planning";

export type ReminderStatus =
  | "overdue"
  | "due-today"
  | "upcoming";

export interface RecurringReminder
  extends RecurringOccurrence {
  schedule: RecurringSchedule;
  status: ReminderStatus;
  daysUntilDue: number;
}

export interface ReminderOptions {
  schedules: readonly RecurringSchedule[];
  transactions: readonly { id: string }[];
  today: string;
  monthsBack?: number;
  daysAhead?: number;
}

// ==========================================
// SHIFT MONTH
// ==========================================

export function shiftMonthKey(
  monthKey: string,
  delta: number
): string {
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      monthKey
    ) ||
    !Number.isInteger(delta)
  ) {
    throw new Error(
      "Invalid month or month offset."
    );
  }

  const [year, month] = monthKey
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1 + delta,
      1
    )
  );

  return (
    `${date.getUTCFullYear()}-` +
    String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")
  );
}

// ==========================================
// SHIFT CALENDAR DATE
// ==========================================

export function shiftDateKey(
  dateKey: string,
  days: number
): string {
  if (
    !isValidDateKey(dateKey) ||
    !Number.isInteger(days)
  ) {
    throw new Error(
      "Invalid date or day offset."
    );
  }

  const [year, month, day] =
    dateKey.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day + days
    )
  );

  return date.toISOString().slice(0, 10);
}

// ==========================================
// CALENDAR-DAY DIFFERENCE
// ==========================================

export function daysBetween(
  from: string,
  to: string
): number {
  if (
    !isValidDateKey(from) ||
    !isValidDateKey(to)
  ) {
    throw new Error(
      "Invalid date key."
    );
  }

  const milliseconds = (date: string) => {
    const [year, month, day] =
      date.split("-").map(Number);

    return Date.UTC(
      year,
      month - 1,
      day
    );
  };

  return Math.round(
    (
      milliseconds(to) -
      milliseconds(from)
    ) / 86_400_000
  );
}

// ==========================================
// BUILD RECURRING REMINDERS
// ==========================================

export function buildRecurringReminders({
  schedules,
  transactions,
  today,
  monthsBack = 3,
  daysAhead = 30,
}: ReminderOptions): RecurringReminder[] {
  if (!isValidDateKey(today)) {
    throw new Error(
      "Invalid current date."
    );
  }

  if (
    !Number.isInteger(monthsBack) ||
    monthsBack < 0 ||
    monthsBack > 24
  ) {
    throw new Error(
      "monthsBack must be between 0 and 24."
    );
  }

  if (
    !Number.isInteger(daysAhead) ||
    daysAhead < 0 ||
    daysAhead > 366
  ) {
    throw new Error(
      "daysAhead must be between 0 and 366."
    );
  }

  const startMonth = shiftMonthKey(
    today.slice(0, 7),
    -monthsBack
  );

  const endDate = shiftDateKey(
    today,
    daysAhead
  );

  const endMonth =
    endDate.slice(0, 7);

  const monthCount =
    (
      Number(endMonth.slice(0, 4)) -
      Number(startMonth.slice(0, 4))
    ) * 12 +
    Number(endMonth.slice(5, 7)) -
    Number(startMonth.slice(5, 7)) +
    1;

  const results:
    RecurringReminder[] = [];

  for (const schedule of schedules) {
    if (!schedule.active) {
      continue;
    }

    for (
      let i = 0;
      i < monthCount;
      i++
    ) {
      const monthKey = shiftMonthKey(
        startMonth,
        i
      );

      const occurrences =
        getOccurrencesForMonth(
          schedule,
          monthKey
        );

      for (
        const occurrence of occurrences
      ) {
        if (
          occurrence.occurredOn <
          schedule.startOn
        ) {
          continue;
        }

        if (
          occurrence.occurredOn >
          endDate
        ) {
          continue;
        }

        if (
          isOccurrencePosted(
            occurrence,
            transactions
          )
        ) {
          continue;
        }

        const daysUntilDue =
          daysBetween(
            today,
            occurrence.occurredOn
          );

        const status: ReminderStatus =
          daysUntilDue < 0
            ? "overdue"
            : daysUntilDue === 0
              ? "due-today"
              : "upcoming";

        results.push({
          ...occurrence,
          schedule,
          status,
          daysUntilDue,
        });
      }
    }
  }

  return results.sort(
    (a, b) =>
      a.occurredOn.localeCompare(
        b.occurredOn
      ) ||
      a.schedule.name.localeCompare(
        b.schedule.name
      )
  );
}
