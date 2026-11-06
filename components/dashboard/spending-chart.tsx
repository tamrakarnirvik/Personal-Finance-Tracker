
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { spendingData } from "@/lib/dashboard-data";

export function SpendingChart() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            Spending Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Historical demo chart — live analytics coming next
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingData}>
              <defs>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#10b981"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="100%"
                    stopColor="#10b981"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              
<CartesianGrid
  vertical={false}
  stroke="var(--border)"
  strokeDasharray="3 3"
/>

<XAxis
  dataKey="month"
  axisLine={false}
  tickLine={false}
  tick={{
    fontSize: 12,
    fill: "var(--muted-foreground)",
  }}
/>

<YAxis
  axisLine={false}
  tickLine={false}
  tick={{
    fontSize: 12,
    fill: "var(--muted-foreground)",
  }}
  width={50}
/>

<Tooltip
  formatter={(value) => [
    `Rs. ${Number(value ?? 0).toLocaleString("en-NP")}`,
    "Expenses",
  ]}
  contentStyle={{
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: 12,
  }}
  labelStyle={{
    color: "var(--popover-foreground)",
  }}
  itemStyle={{
    color: "var(--popover-foreground)",
  }}
/>


              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
