
import { PageHeading } from "@/components/layout/page-heading";
import { BudgetManager } from "@/components/budgets/budget-manager";

export default function BudgetsPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Budgets"
        description="Plan and control your monthly expenses"
      />

      <BudgetManager />
    </div>
  );
}
