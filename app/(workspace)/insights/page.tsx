
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  InsightsWorkspace,
} from "@/components/insights/insights-workspace";

export default function InsightsPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Advanced Insights"
        description="Completed-month comparisons, spending patterns and illustrative expense estimates"
      />

      <InsightsWorkspace />
    </div>
  );
}
