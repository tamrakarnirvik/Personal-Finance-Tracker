
import { Card, CardContent } from "@/components/ui/card";
import {
  formatMoney,
  type SummaryItem,
} from "@/lib/dashboard-data";

interface SummaryCardProps {
  item: SummaryItem;
}

export function SummaryCard({ item }: SummaryCardProps) {
  const Icon = item.icon;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {item.label}
          </p>

          <div className={`rounded-xl p-2.5 ${item.color}`}>
            <Icon size={20} />
          </div>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight">
          {formatMoney(item.amount)}
        </h2>

        <p className="mt-2 text-xs text-slate-400">
          Sample financial data
        </p>
      </CardContent>
    </Card>
  );
}
