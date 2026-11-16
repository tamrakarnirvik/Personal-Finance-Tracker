
import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  RecurringAutomationSettings,
} from "@/components/recurring/recurring-automation-settings";

import {
  RecurringReminderCenter,
} from "@/components/recurring/recurring-reminder-center";

import {
  RecurringManager,
} from "@/components/recurring/recurring-manager";

import {
  RecurringPostingHistory,
} from "@/components/recurring/recurring-posting-history";

export default function RecurringPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Recurring Transactions"
        description="Manage recurring income, expenses, reminders and posting history"
      />

      {/* Automation preferences */}
      <RecurringAutomationSettings />

      {/* Upcoming and overdue reminders */}
      <RecurringReminderCenter />

      {/* Existing recurring schedule manager */}
      <RecurringManager />

      {/* New posting history */}
      <RecurringPostingHistory />
    </div>
  );
}
