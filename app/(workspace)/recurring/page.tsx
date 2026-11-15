
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

export default function RecurringPage() {
  return (
    <div className="space-y-7">
      <PageHeading
        title="Recurring Transactions"
        description="Manage recurring income, expenses and in-app reminders"
      />

      {/* NEW AUTOMATION PREFERENCES */}
      <RecurringAutomationSettings />

      {/* UPCOMING AND OVERDUE REMINDERS */}
      <RecurringReminderCenter />

      {/* EXISTING SCHEDULE MANAGER */}
      <RecurringManager />
    </div>
  );
}
