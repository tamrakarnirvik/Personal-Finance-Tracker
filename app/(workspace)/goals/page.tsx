
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  GoalsManager,
} from "@/components/goals/goals-manager";

export default function GoalsPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Savings Goals"
        description="Set targets and track allocations toward what matters"
      />

      <GoalsManager />
    </div>
  );
}
