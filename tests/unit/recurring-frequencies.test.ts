
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getMonthlyOccurrence,
  getOccurrencesForMonth,
  getRecurringFrequency,
  isRecurringSchedule,
  isRecurringScheduleList,
  type RecurringSchedule,
} from "../../lib/recurring-planning";

import {
  buildRecurringReminders,
} from "../../lib/recurring-reminders";

const base: RecurringSchedule = {
  id: "subscription-1",
  name: "Subscription",
  type: "expense",
  accountId: "cash",
  categoryId: "utilities",
  amountPaisa: 150000,
  startOn: "2026-01-31",
  note: "",
  active: true,
};

describe(
  "Phase 10B schedule frequencies",
  () => {
    it(
      "treats old schedules without frequency as monthly",
      () => {
        expect(
          isRecurringSchedule(base)
        ).toBe(true);

        expect(
          isRecurringScheduleList([base])
        ).toBe(true);

        expect(
          getRecurringFrequency(base)
        ).toBe("monthly");

        expect(
          getMonthlyOccurrence(
            base,
            "2026-02"
          )
        ).toEqual({
          id:
            "recurring:subscription-1:2026-02",
          scheduleId: "subscription-1",
          monthKey: "2026-02",
          occurredOn: "2026-02-28",
        });
      }
    );

    it(
      "creates separate weekly occurrences in the same month",
      () => {
        const weekly: RecurringSchedule = {
          ...base,
          startOn: "2026-11-01",
          frequency: "weekly",
        };

        const occurrences =
          getOccurrencesForMonth(
            weekly,
            "2026-11"
          );

        expect(
          occurrences.map(
            (item) => item.occurredOn
          )
        ).toEqual([
          "2026-11-01",
          "2026-11-08",
          "2026-11-15",
          "2026-11-22",
          "2026-11-29",
        ]);

        expect(
          new Set(
            occurrences.map(
              (item) => item.id
            )
          ).size
        ).toBe(5);

        expect(
          occurrences[2].id
        ).toBe(
          "recurring:subscription-1-wk-20261115:2026-11"
        );

        for (
          const occurrence of occurrences
        ) {
          expect(
            occurrence.id
          ).toMatch(
            /^recurring:[A-Za-z0-9-]+:\d{4}-(0[1-9]|1[0-2])$/
          );

          expect(
            occurrence.occurredOn.slice(0, 7)
          ).toBe(
            occurrence.monthKey
          );
        }
      }
    );

    it(
      "keeps weekly cadence across a month boundary",
      () => {
        const weekly: RecurringSchedule = {
          ...base,
          startOn: "2026-01-30",
          frequency: "weekly",
        };

        expect(
          getOccurrencesForMonth(
            weekly,
            "2026-02"
          ).map(
            (item) => item.occurredOn
          )
        ).toEqual([
          "2026-02-06",
          "2026-02-13",
          "2026-02-20",
          "2026-02-27",
        ]);
      }
    );

    it(
      "repeats yearly and handles leap-day schedules",
      () => {
        const yearly: RecurringSchedule = {
          ...base,
          startOn: "2028-02-29",
          frequency: "yearly",
        };

        expect(
          getOccurrencesForMonth(
            yearly,
            "2027-02"
          )
        ).toHaveLength(0);

        expect(
          getOccurrencesForMonth(
            yearly,
            "2029-01"
          )
        ).toHaveLength(0);

        expect(
          getOccurrencesForMonth(
            yearly,
            "2029-02"
          )[0].occurredOn
        ).toBe(
          "2029-02-28"
        );

        expect(
          getOccurrencesForMonth(
            yearly,
            "2032-02"
          )[0].occurredOn
        ).toBe(
          "2032-02-29"
        );

        expect(
          getOccurrencesForMonth(
            yearly,
            "2029-02"
          )[0].id
        ).toBe(
          "recurring:subscription-1:2029-02"
        );
      }
    );

    it(
      "rejects unknown frequency values",
      () => {
        expect(
          isRecurringSchedule({
            ...base,
            frequency: "daily",
          })
        ).toBe(false);

        expect(
          isRecurringSchedule({
            ...base,
            frequency: "weekly",
          })
        ).toBe(true);
      }
    );

    it(
      "excludes only the weekly occurrence already posted",
      () => {
        const weekly: RecurringSchedule = {
          ...base,
          startOn: "2026-11-01",
          frequency: "weekly",
        };

        const first =
          getOccurrencesForMonth(
            weekly,
            "2026-11"
          )[0];

        const reminders =
          buildRecurringReminders({
            schedules: [weekly],
            transactions: [
              { id: first.id },
            ],
            today: "2026-11-15",
            monthsBack: 0,
            daysAhead: 20,
          });

        expect(
          reminders.map(
            (item) => item.occurredOn
          )
        ).toEqual([
          "2026-11-08",
          "2026-11-15",
          "2026-11-22",
          "2026-11-29",
        ]);

        expect(
          reminders.map(
            (item) => item.status
          )
        ).toEqual([
          "overdue",
          "due-today",
          "upcoming",
          "upcoming",
        ]);
      }
    );

    it(
      "includes yearly reminders only in the anniversary month",
      () => {
        const yearly: RecurringSchedule = {
          ...base,
          startOn: "2025-11-20",
          frequency: "yearly",
        };

        const reminders =
          buildRecurringReminders({
            schedules: [yearly],
            transactions: [],
            today: "2026-11-15",
            monthsBack: 3,
            daysAhead: 30,
          });

        expect(reminders).toHaveLength(1);

        expect(
          reminders[0].occurredOn
        ).toBe("2026-11-20");

        expect(
          reminders[0].status
        ).toBe("upcoming");
      }
    );
  }
);
