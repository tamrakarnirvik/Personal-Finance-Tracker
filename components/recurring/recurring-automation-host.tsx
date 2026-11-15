
"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  useCategories,
} from "@/components/categories/category-provider";

import {
  useTransactions,
} from "@/components/transactions/transaction-provider";

import {
  buildDueTodayCandidates,
} from "@/lib/recurring-automation";

import {
  useLocalDay,
  useRecurringAutomationStore,
} from "@/components/recurring/recurring-automation-store";

// ==========================================
// RECURRING AUTOMATION HOST
// ==========================================

export function RecurringAutomationHost() {
  const {
    accounts,
    transactions,
    postRecurringEntry,
  } = useTransactions();

  const {
    categories,
  } = useCategories();

  const {
    schedules,
    settings,
    error,
  } = useRecurringAutomationStore();

  const today = useLocalDay();

  const lastCheckedDay = useRef<
    string | null
  >(null);

  // ========================================
  // CHECK ENTRIES ON WORKSPACE OPEN
  // ========================================

  useEffect(() => {
    if (
      !today ||
      error ||
      !settings.autoPostDueToday
    ) {
      return;
    }

    if (
      lastCheckedDay.current === today
    ) {
      return;
    }

    // One automatic scan per calendar day
    // in this mounted workspace.
    lastCheckedDay.current = today;

    const due = buildDueTodayCandidates({
      today,
      schedules,
      transactions,
      accounts,
      categories,
    });

    // ======================================
    // POST ELIGIBLE TRANSACTIONS
    // ======================================

    for (const candidate of due) {
      try {
        postRecurringEntry(
          candidate.draft,
          candidate.occurrence.id
        );
      } catch (caught) {
        console.error(
          "Recurring auto-post was rejected:",
          caught
        );
      }
    }
  }, [
    today,
    error,
    settings.autoPostDueToday,
    schedules,
    accounts,
    categories,
    transactions,
    postRecurringEntry,
  ]);

  return null;
}
