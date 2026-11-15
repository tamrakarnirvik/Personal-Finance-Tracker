
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RecurringSchedule,
} from "../../lib/recurring-planning";

import {
  buildRecurringReminders,
  daysBetween,
  shiftDateKey,
  shiftMonthKey,
} from "../../lib/recurring-reminders";

// ==========================================
// SAMPLE MONTHLY SCHEDULE
// ==========================================

const internet: RecurringSchedule = {
  id: "internet-1",
  name: "Internet subscription",
  type: "expense",
  accountId: "cash",
  categoryId: "utilities",
  amountPaisa: 150000,
  startOn: "2026-08-25",
  note: "",
  active: true,
};

// ==========================================
// TESTS
// ==========================================

describe("recurring reminders", () => {
  it(
    "handles month boundaries and leap days",
    () => {
      expect(
        shiftMonthKey(
          "2026-01",
          -1
        )
      ).toBe("2025-12");

      expect(
        shiftMonthKey(
          "2026-12",
          1
        )
      ).toBe("2027-01");

      expect(
        shiftDateKey(
          "2028-02-28",
          1
        )
      ).toBe("2028-02-29");

      expect(
        daysBetween(
          "2026-11-15",
          "2026-11-25"
        )
      ).toBe(10);
    }
  );

  it(
    "shows unpaid overdue and upcoming monthly occurrences",
    () => {
      const reminders =
        buildRecurringReminders({
          schedules: [internet],
          transactions: [],
          today: "2026-11-15",
          monthsBack: 2,
          daysAhead: 30,
        });

      expect(
        reminders.map(
          (item) =>
            item.occurredOn
        )
      ).toEqual([
        "2026-09-25",
        "2026-10-25",
        "2026-11-25",
      ]);

      expect(
        reminders.map(
          (item) =>
            item.status
        )
      ).toEqual([
        "overdue",
        "overdue",
        "upcoming",
      ]);
    }
  );

  it(
    "detects payments due today",
    () => {
      const reminders =
        buildRecurringReminders({
          schedules: [
            {
              ...internet,
              startOn:
                "2026-11-15",
            },
          ],
          transactions: [],
          today: "2026-11-15",
          monthsBack: 0,
          daysAhead: 0,
        });

      expect(reminders).toHaveLength(1);

      expect(
        reminders[0].status
      ).toBe("due-today");

      expect(
        reminders[0].daysUntilDue
      ).toBe(0);
    }
  );

  it(
    "excludes posted occurrences by stable IDs",
    () => {
      const reminders =
        buildRecurringReminders({
          schedules: [internet],
          transactions: [
            {
              id:
                "recurring:internet-1:2026-11",
            },
          ],
          today: "2026-11-15",
          monthsBack: 0,
          daysAhead: 30,
        });

      expect(reminders).toHaveLength(0);
    }
  );

  it(
    "excludes paused schedules",
    () => {
      const reminders =
        buildRecurringReminders({
          schedules: [
            {
              ...internet,
              active: false,
            },
          ],
          transactions: [],
          today: "2026-11-15",
        });

      expect(reminders).toHaveLength(0);
    }
  );

  it(
    "uses the last day of a short month for a 31st schedule",
    () => {
      const reminders =
        buildRecurringReminders({
          schedules: [
            {
              ...internet,
              startOn:
                "2026-01-31",
            },
          ],
          transactions: [],
          today: "2026-02-28",
          monthsBack: 0,
          daysAhead: 0,
        });

      expect(
        reminders[0].occurredOn
      ).toBe("2026-02-28");
    }
  );
});
