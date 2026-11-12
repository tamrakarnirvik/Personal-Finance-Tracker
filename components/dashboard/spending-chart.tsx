
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { useTransactions } from "@/components/transactions/transaction-provider";
import { formatNpr } from "@/lib/finance";
import {
  formatChartAmount,
  getMonthlyTrend,
} from "@/lib/finance-analytics";

interface SpendingChartProps {
  months?: number;
}

export function SpendingChart({
  months = 6,
}: SpendingChartProps) {
  const { transactions } = useTransactions();

  const data = useMemo(
    () => getMonthlyTrend(transactions, months),
    [transactions, months]
  );

  const hasActivity = data.some(
    (month) =>
      month.incomePaisa > 0 ||
      month.expensePaisa > 0
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Income vs Expenses
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Actual activity over the last {months} months
          </p>
        </div>

        {!hasActivity ? (
          <div className="flex h-[290px] items-center justify-center text-center">
            <div>
              <p className="font-medium">
                No financial activity yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Record income or expenses to see your trends.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="h-[290px] w-full min-w-0"
            role="img"
            aria-label={`Income and expense chart for the last ${months} months`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 10,
                  right: 4,
                  bottom: 0,
                  left: 0,
                }}
                barGap={5}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  width={53}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatChartAmount}
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    formatNpr(Number(value ?? 0))
                  }
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  cursor={{
                    fill: "var(--muted)",
                    opacity: 0.3,
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{
                    paddingTop: 12,
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="incomePaisa"
                  name="Income"
                  fill="var(--chart-2)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />

                <Bar
                  dataKey="expensePaisa"
                  name="Expenses"
                  fill="var(--chart-1)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Amounts are displayed in NPR. Transfers between
          your accounts are excluded.
        </p>
      </CardContent>
    </Card>
  );
}
