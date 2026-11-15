
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "@/types/finance";

import {
  getOccurrencesForMonth,
  isValidDateKey,
  type RecurringOccurrence,
  type RecurringSchedule,
} from "@/lib/recurring-planning";

export const RECURRING_AUTOMATION_KEY =
  "expense-tracker-recurring-automation-v1";

export const RECURRING_AUTOMATION_EVENT =
  "expense-tracker-recurring-automation-changed";

export type ReminderWindowDays = 7 | 14 | 30;

export interface RecurringAutomationSettings {
  autoPostDueToday: boolean;
  showDashboardWidget: boolean;
  reminderDaysAhead: ReminderWindowDays;
}

export const DEFAULT_RECURRING_AUTOMATION_SETTINGS:
  Readonly<RecurringAutomationSettings> = {
    autoPostDueToday: false,
    showDashboardWidget: true,
    reminderDaysAhead: 14,
  };

export interface SettingsReadResult {
  settings: RecurringAutomationSettings;
  error: string | null;
}

// ==========================================
// VALIDATE AUTOMATION PREFERENCES
// ==========================================

export function isRecurringAutomationSettings(
  value: unknown
): value is RecurringAutomationSettings {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<
    string,
    unknown
  >;

  return (
    typeof record.autoPostDueToday === "boolean" &&
    typeof record.showDashboardWidget === "boolean" &&
    (
      record.reminderDaysAhead === 7 ||
      record.reminderDaysAhead === 14 ||
      record.reminderDaysAhead === 30
    )
  );
}

// ==========================================
// READ SAVED AUTOMATION PREFERENCES
// ==========================================

export function readRecurringAutomationSettings(
  raw: string | null
): SettingsReadResult {
  if (raw === null) {
    return {
      settings: {
        ...DEFAULT_RECURRING_AUTOMATION_SETTINGS,
      },
      error: null,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecurringAutomationSettings(parsed)) {
      throw new Error("Invalid automation settings");
    }

    return {
      settings: parsed,
      error: null,
    };
  } catch {
    return {
      settings: {
        ...DEFAULT_RECURRING_AUTOMATION_SETTINGS,
      },
      error:
        "Saved automation preferences are invalid. Automatic posting is disabled, and settings will not be overwritten.",
    };
  }
}

// ==========================================
// RECURRING TRANSACTION TYPE
// ==========================================

export type RecurringPostingDraft = Omit<
  Extract<
    FinanceTransaction,
    { type: "income" | "expense" }
  >,
  "id"
>;

export interface DueTodayCandidate {
  schedule: RecurringSchedule;
  occurrence: RecurringOccurrence;
  draft: RecurringPostingDraft;
}

// ==========================================
// FIND ENTRIES ELIGIBLE FOR AUTO-POSTING
// ==========================================

export function buildDueTodayCandidates(args: {
  today: string;
  schedules: readonly RecurringSchedule[];
  transactions: readonly FinanceTransaction[];
  accounts: readonly FinanceAccount[];
  categories: readonly FinanceCategory[];
}): DueTodayCandidate[] {
  const {
    today,
    schedules,
    transactions,
    accounts,
    categories,
  } = args;

  if (!isValidDateKey(today)) {
    throw new Error("Invalid local date.");
  }

  const accountIds = new Set(
    accounts.map((account) => account.id)
  );

  const categoryTypes = new Map(
    categories.map((category) => [
      category.id,
      category.type,
    ])
  );

  const postedIds = new Set(
    transactions.map((entry) => entry.id)
  );

  const result: DueTodayCandidate[] = [];

  for (const schedule of schedules) {
    if (
      !schedule.active ||
      !/^[A-Za-z0-9-]+$/.test(schedule.id)
    ) {
      continue;
    }

    if (!accountIds.has(schedule.accountId)) {
      continue;
    }

    if (
      categoryTypes.get(schedule.categoryId) !==
      schedule.type
    ) {
      continue;
    }

    const occurrences = getOccurrencesForMonth(
      schedule,
      today.slice(0, 7)
    );

    for (const occurrence of occurrences) {
      // Never backfill overdue entries or
      // post an entry scheduled in the future.
      if (
        occurrence.occurredOn !== today ||
        postedIds.has(occurrence.id)
      ) {
        continue;
      }

      const common = {
        accountId: schedule.accountId,
        categoryId: schedule.categoryId,
        amountPaisa: schedule.amountPaisa,
        occurredOn: occurrence.occurredOn,
        note: schedule.note || schedule.name,
      };

      const draft: RecurringPostingDraft =
        schedule.type === "income"
          ? {
              ...common,
              type: "income",
            }
          : {
              ...common,
              type: "expense",
            };

      result.push({
        schedule,
        occurrence,
        draft,
      });

      // Prevent duplicates within this batch.
      postedIds.add(occurrence.id);
    }
  }

  return result;
}
