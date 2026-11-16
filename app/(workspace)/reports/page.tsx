
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  ReportsWorkspace,
} from "@/components/reports/reports-workspace";

export default function ReportsPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Financial Reports"
        description="Analyze a custom period, compare categories, and export your financial records"
      />

      <ReportsWorkspace />
    </div>
  );
}
