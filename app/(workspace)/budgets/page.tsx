
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { formatMoney } from "@/lib/dashboard-data";

const budgets = [
  { name: "Food & Drinks", spent: 7500, limit: 12000 },
  { name: "Shopping", spent: 4500, limit: 7000 },
  { name: "Transportation", spent: 2600, limit: 5000 },
];

export default function BudgetsPage() {
  return (
    <div>
      <PageHeading
        title="Budgets"
        description="Plan and control your monthly expenses"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {budgets.map((budget) => {
          const percentage =
            (budget.spent / budget.limit) * 100;

          return (
            <Card
              key={budget.name}
              className="rounded-2xl shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">
                    {budget.name}
                  </h2>

                  <span className="text-sm text-slate-500">
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div
                  className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  role="progressbar"
                  aria-label={`${budget.name} budget used`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(
                    Math.min(100, percentage)
                  )}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Spent: {formatMoney(budget.spent)}
                  </span>

                  <span>
                    Limit: {formatMoney(budget.limit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-slate-400">
        These are sample budgets. Editing and tracking will be
        implemented in a later phase.
      </p>
    </div>
  );
}
