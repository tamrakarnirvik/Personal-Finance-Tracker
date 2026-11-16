
import type {
  FinanceTransaction,
} from "@/types/finance";

import type {
  RecurringSchedule,
} from "@/lib/recurring-planning";

// ==========================================
// HISTORY RECORD
// ==========================================

export interface PostedRecurringTransaction {
  id: string;
  scheduleId: string;
  scheduleName: string;
  occurredOn: string;

  type: "income" | "expense";

  frequency:
    | "weekly"
    | "monthly"
    | "yearly"
    | "unknown";

  accountId: string;
  categoryId: string;
  amountPaisa: number;
  note: string;
}

// ==========================================
// BUILD HISTORY FROM TRANSACTIONS
// ==========================================

export function buildRecurringPostingHistory(
  transactions: readonly FinanceTransaction[],
  schedules: readonly RecurringSchedule[]
): PostedRecurringTransaction[] {
  const scheduleById = new Map(
    schedules.map(
      (schedule) => [
        schedule.id,
        schedule,
      ]
    )
  );

  const rows:
    PostedRecurringTransaction[] = [];

  for (const transaction of transactions) {
    // Transfers are not recurring entries.

    if (transaction.type === "transfer") {
      continue;
    }

    const match =
      /^recurring:(.+):(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(
        transaction.id
      );

    if (
      !match ||
      !transaction.occurredOn.startsWith(
        match[2]
      )
    ) {
      continue;
    }

    // Detect unique weekly IDs.

    const weekly =
      /^(.*)-wk-(\d{8})$/.exec(
        match[1]
      );

    const isWeekly = Boolean(
      weekly &&
      weekly[2] ===
        transaction.occurredOn.replace(
          /-/g,
          ""
        )
    );

    const scheduleId =
      isWeekly && weekly
        ? weekly[1]
        : match[1];

    const schedule =
      scheduleById.get(scheduleId);

    rows.push({
      id: transaction.id,
      scheduleId,

      scheduleName:
        schedule?.name ??
        transaction.note?.trim() ??
        "Deleted schedule",

      occurredOn:
        transaction.occurredOn,

      type: transaction.type,

      frequency: isWeekly
        ? "weekly"
        : schedule?.frequency === "yearly"
          ? "yearly"
          : schedule
            ? "monthly"
            : "unknown",

      accountId:
        transaction.accountId,

      categoryId:
        transaction.categoryId,

      amountPaisa:
        transaction.amountPaisa,

      note:
        transaction.note ?? "",
    });
  }

  // Most recent transactions first.

  return rows.sort(
    (a, b) =>
      b.occurredOn.localeCompare(
        a.occurredOn
      ) ||
      b.id.localeCompare(a.id)
  );
}

// ==========================================
// SAFE CSV CELL
// ==========================================

function csvCell(
  value: string | number
): string {
  let text = String(value).replace(
    /\r?\n/g,
    " "
  );

  // Protect CSV opened in Excel
  // from spreadsheet formula injection.

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return (
    '"' +
    text.replace(/"/g, '""') +
    '"'
  );
}

// ==========================================
// EXPORT POSTING HISTORY AS CSV
// ==========================================

export function createRecurringHistoryCsv(
  rows: readonly PostedRecurringTransaction[],
  accountName: (id: string) => string,
  categoryName: (id: string) => string
): string {
  const lines = [
    [
      "Date",
      "Schedule",
      "Type",
      "Frequency",
      "Account",
      "Category",
      "Amount NPR",
      "Note",
      "Transaction ID",
    ],

    ...rows.map((row) => [
      row.occurredOn,
      row.scheduleName,
      row.type,
      row.frequency,

      accountName(
        row.accountId
      ),

      categoryName(
        row.categoryId
      ),

      (
        row.amountPaisa / 100
      ).toFixed(2),

      row.note,
      row.id,
    ]),
  ];

  return (
    "\uFEFF" +
    lines
      .map(
        (line) =>
          line.map(csvCell).join(",")
      )
      .join("\r\n")
  );
}
