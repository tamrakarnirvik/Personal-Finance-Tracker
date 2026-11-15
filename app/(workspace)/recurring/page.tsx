
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  RecurringReminderCenter,
} from "@/components/recurring/recurring-reminder-center";

import {
  RecurringManager,
} from "@/components/recurring/recurring-manager";

export default function RecurringPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Recurring Transactions"
        description="Manage monthly income, expenses, and upcoming payment reminders"
      />

      <RecurringReminderCenter />

      <RecurringManager />
    </div>
  );
}
