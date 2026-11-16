
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// ==========================================
// HYDRATION-SAFE MOUNT DETECTION
// ==========================================

function subscribe() {
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

// ==========================================
// THEME TOGGLE
// ==========================================

export function ThemeToggle() {
  const mounted = useMounted();

  const {
    resolvedTheme,
    setTheme,
  } = useTheme();

  // Wait until the current theme is available.
  const isReady =
    mounted &&
    (resolvedTheme === "light" ||
      resolvedTheme === "dark");

  // ========================================
  // TOGGLE LIGHT / DARK
  // ========================================

  function toggleTheme() {
    if (!isReady) {
      return;
    }

    const nextTheme =
      resolvedTheme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
  }

  // ========================================
  // BUTTON
  // ========================================

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!isReady}
      aria-label="Toggle light and dark theme"
      title="Toggle appearance"
      className="
        inline-flex size-10
        items-center justify-center
        rounded-xl
        border border-slate-200
        bg-white text-slate-600
        transition-colors duration-200
        hover:bg-slate-100
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-emerald-600
        disabled:cursor-wait
        dark:border-slate-700
        dark:bg-slate-900
        dark:text-slate-200
        dark:hover:bg-slate-800
      "
    >
      <Moon
        size={18}
        className="dark:hidden"
        aria-hidden="true"
      />

      <Sun
        size={18}
        className="hidden dark:block"
        aria-hidden="true"
      />
    </button>
  );
}
