
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../../types/finance";

import {
  buildFinancialReport,
  getReportPresetRange,
  isReportDate,
  type ReportFilters,
} from "../../lib/finance-reporting";

const accounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
  {
    id: "bank",
    name: "Bank",
    type: "bank",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
];

const categories: FinanceCategory[] = [
  {
    id: "salary",
    name: "Salary",
    type: "income",
  },
  {
    id: "food",
    name: "Food",
    type: "expense",
  },
  {
    id: "rent",
    name: "Rent",
    type: "expense",
  },
];

const transactions: FinanceTransaction[] = [
  {
    id: "t1",
    type: "income",
    accountId: "bank",
    categoryId: "salary",
    amountPaisa: 200000,
    occurredOn: "2026-11-01",
    note: "Pay",
  },
  {
    id: "t2",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 30000,
    occurredOn: "2026-11-03",
    note: "Lunch",
  },
  {
    id: "t3",
    type: "expense",
    accountId: "bank",
    categoryId: "rent",
    amountPaisa: 90000,
    occurredOn: "2026-11-30",
    note: "Rent",
  },
  {
    id: "t4",
    type: "transfer",
    fromAccountId: "bank",
    toAccountId: "cash",
    amountPaisa: 50000,
    occurredOn: "2026-11-07",
    note: "Move funds",
  },
  {
    id: "t5",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 15000,
    occurredOn: "2026-12-01",
    note: "Next month",
  },
];

const filters: ReportFilters = {
  fromDate: "2026-11-01",
  toDate: "2026-11-30",
  accountId: "",
  categoryId: "",
  type: "all",
};

function make(
  overrides: Partial<ReportFilters> = {}
) {
  return buildFinancialReport({
    accounts,
    categories,
    transactions,
    filters: {
      ...filters,
      ...overrides,
    },
  });
}

describe("financial reports", () => {
  it(
    "uses inclusive dates and excludes next month",
    () => {
      const report = make();

      expect(
        report.transactionCount
      ).toBe(4);

      expect(
        report.rows.map(
          (row) => row.id
        )
      ).toEqual([
        "t3",
        "t4",
        "t2",
        "t1",
      ]);

      expect(
        report.incomePaisa
      ).toBe(200000);

      expect(
        report.expensePaisa
      ).toBe(120000);

      expect(
        report.netPaisa
      ).toBe(80000);
    }
  );

  it(
    "keeps transfers out of net cash flow",
    () => {
      const report = make();

      expect(
        report.transferCount
      ).toBe(1);

      expect(
        report.transferVolumePaisa
      ).toBe(50000);

      expect(
        report.monthly[0].netPaisa
      ).toBe(80000);

      expect(
        report.rows.find(
          (row) => row.id === "t4"
        )?.account
      ).toBe(
        "Bank → Cash Wallet"
      );
    }
  );

  it(
    "filters accounts including both transfer sides",
    () => {
      const report = make({
        accountId: "cash",
      });

      expect(
        report.rows.map(
          (row) => row.id
        )
      ).toEqual([
        "t4",
        "t2",
      ]);

      expect(
        report.expensePaisa
      ).toBe(30000);

      expect(
        report.incomePaisa
      ).toBe(0);

      expect(
        report.transferVolumePaisa
      ).toBe(50000);
    }
  );

  it(
    "excludes transfers when filtering categories",
    () => {
      const report = make({
        categoryId: "food",
      });

      expect(
        report.rows.map(
          (row) => row.id
        )
      ).toEqual(["t2"]);

      expect(
        report.expenseCategories[0].percentage
      ).toBe(100);

      expect(
        report.transferCount
      ).toBe(0);
    }
  );

  it(
    "supports transfer-only reports",
    () => {
      const report = make({
        type: "transfer",
      });

      expect(
        report.transactionCount
      ).toBe(1);

      expect(
        report.netPaisa
      ).toBe(0);

      expect(
        report.expenseCategories
      ).toHaveLength(0);
    }
  );

  it(
    "groups data by month including expense-only months",
    () => {
      const report = make({
        toDate: "2026-12-31",
      });

      expect(
        report.monthly.map(
          (row) => row.month
        )
      ).toEqual([
        "2026-11",
        "2026-12",
      ]);

      expect(
        report.monthly[1].netPaisa
      ).toBe(-15000);
    }
  );

  it(
    "handles leap years and date presets",
    () => {
      expect(
        isReportDate("2028-02-29")
      ).toBe(true);

      expect(
        isReportDate("2026-02-29")
      ).toBe(false);

      expect(
        getReportPresetRange(
          "last-month",
          "2026-01-10"
        )
      ).toEqual({
        fromDate: "2025-12-01",
        toDate: "2025-12-31",
      });

      expect(
        getReportPresetRange(
          "last-90-days",
          "2026-11-16"
        )
      ).toEqual({
        fromDate: "2026-08-19",
        toDate: "2026-11-16",
      });
    }
  );

  it(
    "rejects invalid ranges and deleted filters",
    () => {
      expect(() =>
        make({
          fromDate: "2026-12-01",
          toDate: "2026-11-01",
        })
      ).toThrow(/start date/i);

      expect(() =>
        make({
          accountId: "deleted",
        })
      ).toThrow(/account/i);

      expect(() =>
        make({
          categoryId: "deleted",
        })
      ).toThrow(/category/i);

      expect(() =>
        make({
          fromDate: "2026-11-31",
        })
      ).toThrow(/valid/i);
    }
  );

  it(
    "handles empty periods safely",
    () => {
      const report = make({
        fromDate: "2025-01-01",
        toDate: "2025-01-31",
      });

      expect(
        report.rows
      ).toEqual([]);

      expect(
        report.monthly
      ).toEqual([]);

      expect(
        report.netPaisa
      ).toBe(0);

      expect(
        report.expenseCategories
      ).toEqual([]);
    }
  );
});
