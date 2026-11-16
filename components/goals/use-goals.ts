
"use client";

import {
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  GOALS_CHANGE_EVENT,
  GOALS_STORAGE_KEY,
  isGoalWorkspace,
  parseGoalWorkspace,
  type GoalWorkspace,
} from "@/lib/goal-planning";

const UNAVAILABLE =
  "__goals_storage_unavailable__";

function subscribe(
  onChange: () => void
) {
  window.addEventListener(
    "storage",
    onChange
  );

  window.addEventListener(
    GOALS_CHANGE_EVENT,
    onChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      onChange
    );

    window.removeEventListener(
      GOALS_CHANGE_EVENT,
      onChange
    );
  };
}

function snapshot(): string | null {
  try {
    return window.localStorage.getItem(
      GOALS_STORAGE_KEY
    );
  } catch {
    return UNAVAILABLE;
  }
}

function serverSnapshot(): string | null {
  return null;
}

export function useGoals() {
  const raw = useSyncExternalStore(
    subscribe,
    snapshot,
    serverSnapshot
  );

  const result = useMemo(() => {
    try {
      if (raw === UNAVAILABLE) {
        throw new Error(
          "Browser storage is unavailable."
        );
      }

      return {
        workspace: parseGoalWorkspace(raw),
        error: null as string | null,
      };
    } catch (error) {
      return {
        workspace: {
          version: 1,
          goals: [],
          movements: [],
        } as GoalWorkspace,

        error:
          error instanceof Error
            ? error.message
            : "Cannot load goals.",
      };
    }
  }, [raw]);

  function updateGoals(
    change: (
      current: GoalWorkspace
    ) => GoalWorkspace
  ): void {
    if (result.error) {
      throw new Error(result.error);
    }

    // Re-read storage before modifying it.
    // Never overwrite malformed saved data.

    const current = parseGoalWorkspace(
      window.localStorage.getItem(
        GOALS_STORAGE_KEY
      )
    );

    const next = change(current);

    if (!isGoalWorkspace(next)) {
      throw new Error(
        "Goal update failed validation."
      );
    }

    const serialized = JSON.stringify(
      next
    );

    window.localStorage.setItem(
      GOALS_STORAGE_KEY,
      serialized
    );

    if (
      window.localStorage.getItem(
        GOALS_STORAGE_KEY
      ) !== serialized
    ) {
      throw new Error(
        "Could not verify saved goals."
      );
    }

    window.dispatchEvent(
      new Event(GOALS_CHANGE_EVENT)
    );
  }

  return {
    ...result,
    updateGoals,
  };
}
