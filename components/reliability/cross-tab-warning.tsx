
"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  GOALS_STORAGE_KEY,
} from "@/lib/goal-planning";

import {
  RECURRING_STORAGE_KEY,
} from "@/lib/recurring-planning";

import {
  RECURRING_AUTOMATION_KEY,
} from "@/lib/recurring-automation";

import {
  COMPLETE_BACKUP_KEYS,
} from "@/lib/complete-backup-validation";

// ==========================================
// MONITORED STORAGE KEYS
// ==========================================

const watchedKeys = new Set<string>([
  ...Object.values(
    COMPLETE_BACKUP_KEYS
  ),

  GOALS_STORAGE_KEY,
  RECURRING_STORAGE_KEY,
  RECURRING_AUTOMATION_KEY,
]);

// ==========================================
// CROSS-TAB WARNING
// ==========================================

export function CrossTabWarning() {
  const [
    changed,
    setChanged,
  ] = useState(false);

  useEffect(() => {
    function onStorage(
      event: StorageEvent
    ) {
      // A null key can indicate
      // localStorage.clear().

      if (
        event.storageArea ===
          window.localStorage &&
        (
          event.key === null ||
          watchedKeys.has(
            event.key
          )
        )
      ) {
        setChanged(true);
      }
    }

    window.addEventListener(
      "storage",
      onStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        onStorage
      );
    };
  }, []);

  if (!changed) {
    return null;
  }

  return (
    <aside
      role="alert"
      className="relative z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <p className="flex max-w-3xl items-start gap-2">
        <AlertTriangle
          size={18}
          className="mt-0.5 shrink-0"
        />

        Data changed in another tab.
        Stop editing this tab. Your app
        cannot merge simultaneous writes
        safely. Review the other tab,
        back up your data, then reload
        to resync.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          window.location.reload()
        }
      >
        Reload this tab
      </Button>
    </aside>
  );
}
