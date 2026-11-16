
import type {
  FinancialReport,
  ReportCategoryRow,
  ReportMonthlyRow,
} from "@/lib/finance-reporting";

export type FinanceCsvKind =
  | "transactions"
  | "monthly"
  | "categories";

// ==========================================
// SECURE CSV CELL
// ==========================================

export function csvCell(
  value: string | number
): string {
  let text = String(value).replace(
    /\r\n?|\n/g,
    " "
  );

  // Prevent spreadsheet formulas
  // from executing when opened in Excel.
  if (
    /^[\s\u0000-\u001f]*[=+\-@]/.test(text)
  ) {
    text = "'" + text;
  }

  return (
    `"${text.replace(/"/g, '""')}"`
  );
}

function csvFromTable(
  rows: Array<Array<string | number>>
): string {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row.map(csvCell).join(",")
      )
      .join("\r\n") +
    "\r\n"
  );
}

// ==========================================
// TRANSACTIONS CSV
// ==========================================

export function buildTransactionsCsv(
  report: FinancialReport
): string {
  return csvFromTable([
    [
      "Date",
      "Type",
      "Description",
      "Account / Transfer",
      "Category",
      "Amount NPR",
      "Transaction ID",
    ],

    ...report.rows.map((row) => [
      row.occurredOn,
      row.type,
      row.description,
      row.account,
      row.category,
      (row.amountPaisa / 100).toFixed(2),
      row.id,
    ]),
  ]);
}

// ==========================================
// MONTHLY SUMMARY CSV
// ==========================================

export function buildMonthlyCsv(
  report: FinancialReport
): string {
  return csvFromTable([
    [
      "Month",
      "Income NPR",
      "Expenses NPR",
      "Net Cash Flow NPR",
      "Transfer Volume NPR",
      "Transactions",
    ],

    ...report.monthly.map(
      (row: ReportMonthlyRow) => [
        row.month,

        (row.incomePaisa / 100).toFixed(2),

        (row.expensePaisa / 100).toFixed(2),

        (row.netPaisa / 100).toFixed(2),

        (
          row.transferVolumePaisa / 100
        ).toFixed(2),

        row.transactionCount,
      ]
    ),
  ]);
}

// ==========================================
// CATEGORY COMPARISON CSV
// ==========================================

export function buildCategoriesCsv(
  report: FinancialReport
): string {
  const rows: ReportCategoryRow[] = [
    ...report.expenseCategories,
    ...report.incomeCategories,
  ];

  return csvFromTable([
    [
      "Type",
      "Category",
      "Amount NPR",
      "Share of Type %",
      "Transactions",
      "Category ID",
    ],

    ...rows.map((row) => [
      row.type,
      row.category,

      (row.amountPaisa / 100).toFixed(2),

      row.percentage.toFixed(2),
      row.transactionCount,
      row.categoryId,
    ]),
  ]);
}

// ==========================================
// SELECT CSV EXPORT TYPE
// ==========================================

export function buildFinanceCsv(
  report: FinancialReport,
  kind: FinanceCsvKind
): string {
  switch (kind) {
    case "transactions":
      return buildTransactionsCsv(report);

    case "monthly":
      return buildMonthlyCsv(report);

    case "categories":
      return buildCategoriesCsv(report);
  }
}

// ==========================================
// EXPORT FILENAME
// ==========================================

export function financeExportFilename(
  report: FinancialReport,
  kind: FinanceCsvKind
): string {
  return (
    `expense-tracker-${kind}-` +
    `${report.filters.fromDate}-to-` +
    `${report.filters.toDate}.csv`
  );
}

// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ==========================================
// REPORT CURRENCY
// ==========================================

function npr(
  paisa: number
): string {
  return (
    "NPR " +
    (paisa / 100).toLocaleString(
      "en-NP",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )
  );
}

// ==========================================
// PRINTABLE FINANCIAL REPORT
// ==========================================

export function buildPrintableFinancialReportHtml(
  report: FinancialReport,
  generatedOn: string
): string {
  const {
    filters,
  } = report;

  const fmt = (value: string) =>
    escapeHtml(value);

  const monthly = report.monthly
    .map(
      (m) => `
      <tr>
        <td>${fmt(m.month)}</td>
        <td>${npr(m.incomePaisa)}</td>
        <td>${npr(m.expensePaisa)}</td>
        <td>${npr(m.netPaisa)}</td>
        <td>${npr(m.transferVolumePaisa)}</td>
      </tr>`
    )
    .join("");

  const categories = [
    ...report.expenseCategories,
    ...report.incomeCategories,
  ]
    .map(
      (c) => `
      <tr>
        <td>${fmt(c.type)}</td>
        <td>${fmt(c.category)}</td>
        <td>${npr(c.amountPaisa)}</td>
        <td>${c.percentage.toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  const displayed =
    report.rows.slice(0, 250);

  const statement = displayed
    .map(
      (r) => `
      <tr>
        <td>${fmt(r.occurredOn)}</td>
        <td>${fmt(r.type)}</td>
        <td>${fmt(r.description)}</td>
        <td>${fmt(r.account)}</td>
        <td>${fmt(r.category)}</td>
        <td>${npr(r.amountPaisa)}</td>
      </tr>`
    )
    .join("");

  const scope = [
    `Account: ${filters.accountId || "All accounts"}`,
    `Category: ${filters.categoryId || "All categories"}`,
    `Type: ${filters.type}`,
  ]
    .map(fmt)
    .join(" &nbsp; | &nbsp; ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Expense Tracker Financial Report</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #19252c;
      line-height: 1.45;
      margin: 0;
      padding: 30px;
      font-size: 12px;
    }

    h1 {
      font-size: 24px;
      margin: 0 0 5px;
    }

    h2 {
      font-size: 15px;
      margin: 26px 0 8px;
    }

    p {
      margin: 6px 0;
      color: #52616a;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin: 20px 0;
    }

    .metric {
      border: 1px solid #d5dce0;
      border-radius: 8px;
      padding: 10px;
    }

    .metric span {
      display: block;
      color: #566570;
      font-size: 11px;
    }

    .metric strong {
      display: block;
      margin-top: 4px;
      font-size: 15px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 10px;
      table-layout: fixed;
    }

    th, td {
      padding: 7px 6px;
      border-bottom: 1px solid #e0e5e8;
      text-align: left;
      overflow-wrap: anywhere;
    }

    th {
      background: #f1f4f5;
      color: #253943;
    }

    tr {
      break-inside: avoid;
    }

    .notice {
      background: #f1f4f5;
      padding: 10px;
      border-radius: 8px;
    }

    .toolbar {
      margin-bottom: 20px;
    }

    .toolbar button {
      padding: 9px 15px;
      border-radius: 6px;
      border: 1px solid #a0aeb5;
      background: #fff;
      cursor: pointer;
    }

    @media print {
      body {
        padding: 0;
      }

      .toolbar {
        display: none;
      }

      @page {
        margin: 14mm;
      }
    }
  </style>
</head>

<body>
  <div class="toolbar">
    <button onclick="window.print()">
      Print / Save as PDF
    </button>
  </div>

  <h1>Financial report</h1>

  <p>
    ${fmt(filters.fromDate)} to ${fmt(filters.toDate)}
    &nbsp; • &nbsp;
    Prepared ${fmt(generatedOn)}
  </p>

  <p>${scope}</p>

  <div class="metrics">
    <div class="metric">
      <span>Income</span>
      <strong>${npr(report.incomePaisa)}</strong>
    </div>

    <div class="metric">
      <span>Expenses</span>
      <strong>${npr(report.expensePaisa)}</strong>
    </div>

    <div class="metric">
      <span>Net cash flow</span>
      <strong>${npr(report.netPaisa)}</strong>
    </div>

    <div class="metric">
      <span>Transfer volume (excluded from net)</span>
      <strong>${npr(report.transferVolumePaisa)}</strong>
    </div>
  </div>

  <p class="notice">
    Transfers between your own accounts are not counted
    as income or expenses. This report is based only on
    transactions recorded in Expense Tracker.
    Savings goal allocations are not included.
  </p>

  <h2>Monthly summary</h2>

  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Income</th>
        <th>Expenses</th>
        <th>Net</th>
        <th>Transfers</th>
      </tr>
    </thead>

    <tbody>
      ${
        monthly ||
        '<tr><td colspan="5">No transactions</td></tr>'
      }
    </tbody>
  </table>

  <h2>Category comparison</h2>

  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Category</th>
        <th>Amount</th>
        <th>Share</th>
      </tr>
    </thead>

    <tbody>
      ${
        categories ||
        '<tr><td colspan="4">No categorized income or expenses</td></tr>'
      }
    </tbody>
  </table>

  <h2>
    Transaction statement
    (${displayed.length}${
      report.rows.length > displayed.length
        ? ` of ${report.rows.length}`
        : ""
    })
  </h2>

  ${
    report.rows.length > displayed.length
      ? '<p>Only the first 250 entries appear here; export the transactions CSV for the complete statement.</p>'
      : ""
  }

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Description</th>
        <th>Account</th>
        <th>Category</th>
        <th>Amount</th>
      </tr>
    </thead>

    <tbody>
      ${
        statement ||
        '<tr><td colspan="6">No transactions match the filters</td></tr>'
      }
    </tbody>
  </table>
</body>
</html>`;
}
