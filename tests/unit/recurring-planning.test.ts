
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getMonthlyOccurrence,
  isOccurrencePosted,
  isRecurringSchedule,
  isRecurringScheduleList,
  isValidDateKey,
  type RecurringSchedule,
} from "../../lib/recurring-planning";

// ==========================================
// SAMPLE RECURRING SCHEDULE
// ==========================================

const rent: RecurringSchedule = {
  id: "rent-1",
  name: "Rent",
  type: "expense",
  accountId: "cash",
  categoryId: "housing",
  amountPaisa: 1200000,
  startOn: "2026-01-31",
  note: "Monthly rent",
  active: true,
};

// ==========================================
// UNIT TESTS
// ==========================================

describe("recurring monthly schedules", () => {
  it(
    "rejects nonexistent calendar dates",
    () => {
      expect(
        isValidDateKey("2026-02-29")
      ).toBe(false);

      expect(
        isValidDateKey("2028-02-29")
      ).toBe(true);
    }
  );

  it(
    "clamps the 31st to the last day of February",
    () => {
      const feb = getMonthlyOccurrence(
        rent,
        "2026-02"
      );

      expect(
        feb?.occurredOn
      ).toBe("2026-02-28");

      expect(
        feb?.id
      ).toBe(
        "recurring:rent-1:2026-02"
      );
    }
  );

  it(
    "does not create an occurrence before the start month",
    () => {
      expect(
        getMonthlyOccurrence(
          rent,
          "2025-12"
        )
      ).toBeNull();
    }
  );

  it(
    "detects posted months using the stable transaction ID",
    () => {
      const feb = getMonthlyOccurrence(
        rent,
        "2026-02"
      )!;

      expect(
        isOccurrencePosted(
          feb,
          [
            {
              id: feb.id,
            },
          ]
        )
      ).toBe(true);

      expect(
        isOccurrencePosted(
          feb,
          []
        )
      ).toBe(false);
    }
  );

  it(
    "validates schedules and disallows duplicate IDs",
    () => {
      expect(
        isRecurringSchedule(rent)
      ).toBe(true);

      expect(
        isRecurringSchedule({
          ...rent,
          amountPaisa: -10,
        })
      ).toBe(false);

      expect(
        isRecurringScheduleList([
          rent,
          rent,
        ])
      ).toBe(false);
    }
  );
});
