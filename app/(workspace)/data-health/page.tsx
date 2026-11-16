
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  DataHealthPanel,
} from "@/components/reliability/data-health-panel";

export default function DataHealthPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Data Health"
        description="Check local finance data references and complete-backup readiness"
      />

      <DataHealthPanel />
    </div>
  );
}
