
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
  type ReportFilters,
} from "../../lib/finance-reporting";

import {
  buildFinanceCsv,
  buildPrintableFinancialReportHtml,
  csvCell,
  financeExportFilename,
} from "../../lib/finance-report-export";

const accounts = [
  {
    id: "cash",
    name: "Cash",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
] as FinanceAccount[];

const categories = [
  {
    id: "food",
    name: "Food",
    type: "expense",
  },
] as FinanceCategory[];

const transactions = [
  {
    id: "one",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 12505,
    occurredOn: "2026-11-12",
    note:
      '=HYPERLINK("https://example.com", "CLICK")',
  },
  {
    id: "two",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 10000,
    occurredOn: "2026-11-14",
    note:
      "</script><img src=x onerror=alert(1)>",
  },
] as FinanceTransaction[];

const filters: ReportFilters = {
  fromDate: "2026-11-01",
  toDate: "2026-11-30",
  accountId: "",
  categoryId: "",
  type: "all",
};

const report = buildFinancialReport({
  accounts,
  categories,
  transactions,
  filters,
});

describe("financial report exports", () => {
  it(
    "protects CSV from formula-like text",
    () => {
      const csv = buildFinanceCsv(
        report,
        "transactions"
      );

      expect(
        csv.startsWith("\uFEFF")
      ).toBe(true);

      expect(
        csv
      ).toContain("'=HYPERLINK");

      expect(
        csv
      ).toContain("125.05");

      expect(
        csvCell("a,b")
      ).toBe('"a,b"');

      expect(
        csvCell("+3")
      ).toBe("\"'+3\"");
    }
  );

  it(
    "exports monthly and category summaries",
    () => {
      const months = buildFinanceCsv(
        report,
        "monthly"
      );

      const groups = buildFinanceCsv(
        report,
        "categories"
      );

      expect(
        months
      ).toContain("2026-11");

      expect(
        months
      ).toContain("225.05");

      expect(
        groups
      ).toContain("Food");

      expect(
        groups
      ).toContain("100.00");
    }
  );

  it(
    "escapes HTML in printable reports",
    () => {
      const html =
        buildPrintableFinancialReportHtml(
          report,
          "2026-11-16"
        );

      expect(html).toContain(
        "&lt;/script&gt;"
      );

      expect(html).not.toContain(
        "</script><img"
      );

      expect(html).toContain(
        "Print / Save as PDF"
      );

      expect(html).toContain(
        "2026-11-01 to 2026-11-30"
      );
    }
  );

  it(
    "creates predictable export filenames",
    () => {
      expect(
        financeExportFilename(
          report,
          "monthly"
        )
      ).toBe(
        "expense-tracker-monthly-2026-11-01-to-2026-11-30.csv"
      );
    }
  );
});
