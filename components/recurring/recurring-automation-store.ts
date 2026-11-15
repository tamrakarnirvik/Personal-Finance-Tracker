
"use client";

import {
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  RECURRING_CHANGE_EVENT,
  RECURRING_STORAGE_KEY,
  getLocalDateKey,
  isRecurringScheduleList,
  type RecurringSchedule,
} from "@/lib/recurring-planning";

import {
  RECURRING_AUTOMATION_EVENT,
  RECURRING_AUTOMATION_KEY,
  isRecurringAutomationSettings,
  readRecurringAutomationSettings,
  type RecurringAutomationSettings,
} from "@/lib/recurring-automation";

const STORAGE_UNAVAILABLE =
  "__recurring_automation_storage_unavailable__";

// ==========================================
// STORAGE SUBSCRIPTION
// ==========================================

function subscribeToStorage(
  onChange: () => void
) {
  window.addEventListener("storage", onChange);

  window.addEventListener(
    RECURRING_CHANGE_EVENT,
    onChange
  );

  window.addEventListener(
    RECURRING_AUTOMATION_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      onChange
    );

    window.removeEventListener(
      RECURRING_CHANGE_EVENT,
      onChange
    );

    window.removeEventListener(
      RECURRING_AUTOMATION_EVENT,
      onChange
    );
  };
}

// ==========================================
// READ LOCAL STORAGE
// ==========================================

function readRaw(
  key: string
): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return STORAGE_UNAVAILABLE;
  }
}

const getSchedulesSnapshot = () =>
  readRaw(RECURRING_STORAGE_KEY);

const getSettingsSnapshot = () =>
  readRaw(RECURRING_AUTOMATION_KEY);

const getServerSnapshot = () => null;

// ==========================================
// PARSE SCHEDULES SAFELY
// ==========================================

function parseSchedules(
  raw: string | null
): {
  schedules: RecurringSchedule[];
  error: string | null;
} {
  if (raw === null) {
    return {
      schedules: [],
      error: null,
    };
  }

  if (raw === STORAGE_UNAVAILABLE) {
    return {
      schedules: [],
      error: "Browser storage is unavailable.",
    };
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!isRecurringScheduleList(value)) {
      throw new Error("Invalid schedules");
    }

    return {
      schedules: value,
      error: null,
    };
  } catch {
    return {
      schedules: [],
      error:
        "Recurring schedules are unreadable. Automatic posting is disabled.",
    };
  }
}

// ==========================================
// SHARED AUTOMATION STORE
// ==========================================

export function useRecurringAutomationStore() {
  const schedulesRaw = useSyncExternalStore(
    subscribeToStorage,
    getSchedulesSnapshot,
    getServerSnapshot
  );

  const settingsRaw = useSyncExternalStore(
    subscribeToStorage,
    getSettingsSnapshot,
    getServerSnapshot
  );

  const schedulesResult = useMemo(
    () => parseSchedules(schedulesRaw),
    [schedulesRaw]
  );

  const settingsResult = useMemo(() => {
    if (settingsRaw === STORAGE_UNAVAILABLE) {
      return {
        settings:
          readRecurringAutomationSettings(null).settings,
        error: "Browser storage is unavailable.",
      };
    }

    return readRecurringAutomationSettings(
      settingsRaw
    );
  }, [settingsRaw]);

  const error =
    schedulesResult.error ??
    settingsResult.error;

  // ========================================
  // SAVE PREFERENCES
  // ========================================

  function saveSettings(
    settings: RecurringAutomationSettings
  ) {
    if (error) {
      throw new Error(error);
    }

    if (!isRecurringAutomationSettings(settings)) {
      throw new Error(
        "Invalid automation preferences."
      );
    }

    window.localStorage.setItem(
      RECURRING_AUTOMATION_KEY,
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new Event(RECURRING_AUTOMATION_EVENT)
    );
  }

  return {
    schedules: schedulesResult.schedules,
    settings: settingsResult.settings,
    error,
    saveSettings,
  };
}

// ==========================================
// LOCAL DAY TRACKING
// ==========================================

function subscribeToLocalDay(
  onChange: () => void
) {
  window.addEventListener("focus", onChange);
  window.addEventListener("pageshow", onChange);

  document.addEventListener(
    "visibilitychange",
    onChange
  );

  return () => {
    window.removeEventListener(
      "focus",
      onChange
    );

    window.removeEventListener(
      "pageshow",
      onChange
    );

    document.removeEventListener(
      "visibilitychange",
      onChange
    );
  };
}

export function useLocalDay(): string {
  return useSyncExternalStore(
    subscribeToLocalDay,
    getLocalDateKey,
    () => ""
  );
}
