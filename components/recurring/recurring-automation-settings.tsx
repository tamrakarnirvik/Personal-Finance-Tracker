
"use client";

import {
  useState,
} from "react";

import {
  Bell,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  useRecurringAutomationStore,
} from "@/components/recurring/recurring-automation-store";

import type {
  RecurringAutomationSettings,
  ReminderWindowDays,
} from "@/lib/recurring-automation";

const selectStyle =
  "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ==========================================
// AUTOMATION SETTINGS
// ==========================================

export function RecurringAutomationSettings() {
  const {
    settings,
    error: storageError,
    saveSettings,
  } = useRecurringAutomationStore();

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  // ========================================
  // SAVE NEW SETTINGS
  // ========================================

  function update(
    patch: Partial<RecurringAutomationSettings>
  ) {
    setActionError("");
    setNotice("");

    try {
      saveSettings({
        ...settings,
        ...patch,
      });

      setNotice(
        "Preferences saved on this device."
      );
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Could not save preferences."
      );
    }
  }

  // ========================================
  // ENABLE OR DISABLE AUTO-POSTING
  // ========================================

  function toggleAutoPost(
    enabled: boolean
  ) {
    if (enabled) {
      const agreed = window.confirm(
        "Enable automatic posting? When this workspace opens (or you enable this setting), " +
        "any recurring income or expense due TODAY will be recorded without another confirmation. " +
        "This changes your account balances. Overdue and future entries are never auto-posted. Continue?"
      );

      if (!agreed) {
        return;
      }
    }

    update({
      autoPostDueToday: enabled,
    });
  }

  // ========================================
  // SETTINGS INTERFACE
  // ========================================

  return (
    <section
      aria-label="Recurring automation preferences"
      className="clean-panel space-y-5 p-5 sm:p-6"
    >
      {/* HEADING */}

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Sparkles
            size={19}
            className="text-primary"
          />
        </div>

        <div>
          <h2 className="text-base font-semibold">
            Automation & reminders
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Control automatic posting and
            in-app reminder visibility.
          </p>
        </div>
      </div>

      {/* AUTO-POST TOGGLE */}

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4">
        <span className="space-y-1">
          <span className="block text-sm font-medium">
            Post due-today entries on open
          </span>

          <span className="block text-xs leading-relaxed text-muted-foreground">
            Off by default. If enabled,
            
opening the app or enabling this
option records today&apos;s due income
and expenses without a separate click.

          </span>
        </span>

        <input
          aria-label="Post due-today entries on open"
          type="checkbox"
          checked={settings.autoPostDueToday}
          disabled={Boolean(storageError)}
          onChange={(event) =>
            toggleAutoPost(
              event.target.checked
            )
          }
          className="mt-1 size-4 shrink-0 accent-primary"
        />
      </label>

      {/* SAFETY INFORMATION */}

      <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldAlert
          size={17}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <p>
          Auto-posting does not verify that
          money was actually paid or received.
          Use manual posting if you need payment
          confirmation. Keep only one Expense
          Tracker tab open when making changes.
        </p>
      </div>

      {/* REMINDER WINDOW */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div>
          <label
            htmlFor="recurring-reminder-window"
            className="block text-sm font-medium"
          >
            Upcoming reminder window
          </label>

          <p className="mt-1 text-xs text-muted-foreground">
            Used by the Dashboard widget;
            overdue entries are shown separately.
          </p>
        </div>

        <select
          id="recurring-reminder-window"
          value={settings.reminderDaysAhead}
          disabled={Boolean(storageError)}
          className={selectStyle}
          onChange={(event) =>
            update({
              reminderDaysAhead:
                Number(
                  event.target.value
                ) as ReminderWindowDays,
            })
          }
        >
          <option value={7}>
            Next 7 days
          </option>

          <option value={14}>
            Next 14 days
          </option>

          <option value={30}>
            Next 30 days
          </option>
        </select>
      </div>

      {/* DASHBOARD REMINDERS */}

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4">
        <span className="space-y-1">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Bell size={16} />
            Show reminders on Dashboard
          </span>

          <span className="block text-xs leading-relaxed text-muted-foreground">
            Display counts and a quick link
            to unpaid recurring entries.
          </span>
        </span>

        <input
          aria-label="Show reminders on Dashboard"
          type="checkbox"
          checked={settings.showDashboardWidget}
          disabled={Boolean(storageError)}
          onChange={(event) =>
            update({
              showDashboardWidget:
                event.target.checked,
            })
          }
          className="mt-1 size-4 shrink-0 accent-primary"
        />
      </label>

      {/* MESSAGES */}

      {storageError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {storageError}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          {notice}
        </p>
      )}

      {/* FOOTER */}

      <p className="text-xs text-muted-foreground">
        These are in-app preferences only:
        no email, push alerts, or background
        payments. This preferences key is not
        yet included in Complete Backup v2;
        your financial records and recurring
        schedules remain covered there.
      </p>
    </section>
  );
}
