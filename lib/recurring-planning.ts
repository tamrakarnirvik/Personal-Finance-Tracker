
/**
 * Recurring schedules.
 * All amounts are stored in integer NPR paisa.
 */

export const RECURRING_STORAGE_KEY =
  "expense-tracker-recurring-v1";

export const RECURRING_CHANGE_EVENT =
  "expense-tracker-recurring-changed";

export type RecurringKind =
  | "income"
  | "expense";

export type RecurringFrequency =
  | "weekly"
  | "monthly"
  | "yearly";

export interface RecurringSchedule {
  id: string;
  name: string;
  type: RecurringKind;
  accountId: string;
  categoryId: string;
  amountPaisa: number;
  startOn: string;
  note: string;
  active: boolean;

  // Older schedules have no frequency.
  // They remain monthly automatically.
  frequency?: RecurringFrequency;
}

export interface RecurringOccurrence {
  id: string;
  scheduleId: string;
  monthKey: string;
  occurredOn: string;
}

const DAY_MS = 86_400_000;

// ==========================================
// VALIDATE DATE
// ==========================================

export function isValidDateKey(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  return day <= new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();
}

// ==========================================
// GET LOCAL DATE
// ==========================================

export function getLocalDateKey(
  date: Date = new Date()
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// RESOLVE FREQUENCY
// ==========================================

export function getRecurringFrequency(
  schedule: RecurringSchedule
): RecurringFrequency {
  return schedule.frequency ?? "monthly";
}

// ==========================================
// VALIDATE SCHEDULE
// ==========================================

export function isRecurringSchedule(
  value: unknown
): value is RecurringSchedule {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item = value as Record<
    string,
    unknown
  >;

  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&

    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    item.name.length <= 80 &&

    (
      item.type === "income" ||
      item.type === "expense"
    ) &&

    typeof item.accountId === "string" &&
    item.accountId.length > 0 &&

    typeof item.categoryId === "string" &&
    item.categoryId.length > 0 &&

    Number.isSafeInteger(
      item.amountPaisa
    ) &&
    Number(item.amountPaisa) > 0 &&

    isValidDateKey(item.startOn) &&

    typeof item.note === "string" &&
    item.note.length <= 240 &&

    typeof item.active === "boolean" &&

    (
      item.frequency === undefined ||
      item.frequency === "weekly" ||
      item.frequency === "monthly" ||
      item.frequency === "yearly"
    )
  );
}

// ==========================================
// VALIDATE SAVED SCHEDULE LIST
// ==========================================

export function isRecurringScheduleList(
  value: unknown
): value is RecurringSchedule[] {
  return (
    Array.isArray(value) &&
    value.every(isRecurringSchedule) &&

    new Set(
      value.map(
        (item: RecurringSchedule) =>
          item.id
      )
    ).size === value.length
  );
}

// ==========================================
// DATE UTILITIES
// ==========================================

function dateUtc(
  key: string
): number {
  const [year, month, day] = key
    .split("-")
    .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day
  );
}

function lastDayOfMonth(
  monthKey: string
): number {
  const [year, month] = monthKey
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();
}

function validMonthKey(
  monthKey: string
): boolean {
  return (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      monthKey
    ) &&
    Number(
      monthKey.slice(0, 4)
    ) >= 1000
  );
}

// ==========================================
// EXISTING MONTHLY OCCURRENCES
// ==========================================

export function getMonthlyOccurrence(
  schedule: RecurringSchedule,
  monthKey: string
): RecurringOccurrence | null {
  if (
    getRecurringFrequency(schedule) !==
      "monthly" ||
    !validMonthKey(monthKey)
  ) {
    return null;
  }

  if (
    monthKey <
    schedule.startOn.slice(0, 7)
  ) {
    return null;
  }

  const anchorDay = Number(
    schedule.startOn.slice(8, 10)
  );

  const dueDay = String(
    Math.min(
      anchorDay,
      lastDayOfMonth(monthKey)
    )
  ).padStart(2, "0");

  return {
    id: `recurring:${schedule.id}:${monthKey}`,
    scheduleId: schedule.id,
    monthKey,
    occurredOn: `${monthKey}-${dueDay}`,
  };
}

// ==========================================
// ALL OCCURRENCES FOR SELECTED MONTH
// ==========================================

export function getOccurrencesForMonth(
  schedule: RecurringSchedule,
  monthKey: string
): RecurringOccurrence[] {
  if (
    !validMonthKey(monthKey) ||
    !isValidDateKey(schedule.startOn)
  ) {
    return [];
  }

  const frequency =
    getRecurringFrequency(schedule);

  // MONTHLY

  if (frequency === "monthly") {
    const occurrence =
      getMonthlyOccurrence(
        schedule,
        monthKey
      );

    return occurrence
      ? [occurrence]
      : [];
  }

  // YEARLY

  if (frequency === "yearly") {
    if (
      monthKey.slice(5, 7) !==
        schedule.startOn.slice(5, 7) ||
      monthKey <
        schedule.startOn.slice(0, 7)
    ) {
      return [];
    }

    const anchorDay = Number(
      schedule.startOn.slice(8, 10)
    );

    const dueDay = String(
      Math.min(
        anchorDay,
        lastDayOfMonth(monthKey)
      )
    ).padStart(2, "0");

    return [
      {
        id: `recurring:${schedule.id}:${monthKey}`,
        scheduleId: schedule.id,
        monthKey,
        occurredOn: `${monthKey}-${dueDay}`,
      },
    ];
  }

  // WEEKLY — EVERY SEVEN CALENDAR DAYS

  const firstDayMs = dateUtc(
    `${monthKey}-01`
  );

  const endMs = dateUtc(
    `${monthKey}-${String(
      lastDayOfMonth(monthKey)
    ).padStart(2, "0")}`
  );

  const anchorMs = dateUtc(
    schedule.startOn
  );

  const firstStep = Math.max(
    0,
    Math.ceil(
      (firstDayMs - anchorMs) /
        (7 * DAY_MS)
    )
  );

  const occurrences:
    RecurringOccurrence[] = [];

  for (
    let ms =
      anchorMs +
      firstStep * 7 * DAY_MS;
    ms <= endMs;
    ms += 7 * DAY_MS
  ) {
    if (ms < firstDayMs) {
      continue;
    }

    const occurredOn =
      new Date(ms)
        .toISOString()
        .slice(0, 10);

    const dateStamp =
      occurredOn.replace(/-/g, "");

    occurrences.push({
      // Date stamp keeps weekly IDs unique,
      // while the month suffix remains
      // compatible with the existing provider.
      id:
        `recurring:${schedule.id}` +
        `-wk-${dateStamp}:${monthKey}`,

      scheduleId: schedule.id,
      monthKey,
      occurredOn,
    });
  }

  return occurrences;
}

// ==========================================
// CHECK WHETHER ENTRY WAS POSTED
// ==========================================

export function isOccurrencePosted(
  occurrence: RecurringOccurrence,
  transactions: readonly {
    id: string;
  }[]
): boolean {
  return transactions.some(
    (transaction) =>
      transaction.id === occurrence.id
  );
}
