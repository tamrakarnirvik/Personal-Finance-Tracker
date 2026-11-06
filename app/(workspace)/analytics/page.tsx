
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { SpendingChart } from "@/components/dashboard/spending-chart";

import {
  spendingData,
  formatMoney,
} from "@/lib/dashboard-data";

export default function AnalyticsPage() {
  const total = spendingData.reduce(
    (sum, item) => sum + item.expenses,
    0
  );

  const average = total / spendingData.length;

  const highest = spendingData.reduce(
    (max, item) =>
      item.expenses > max.expenses ? item : max,
    spendingData[0]
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Analytics"
        description="Understand your financial patterns"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">
              Average Monthly Expenses
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {formatMoney(average)}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Six-month demo average
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">
              Highest Spending Month
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              {formatMoney(highest.expenses)}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              {highest.month} · Sample data
            </p>
          </CardContent>
        </Card>
      </div>

      <SpendingChart />
    </div>
  );
}
