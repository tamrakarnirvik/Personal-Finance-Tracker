
"use client";

import * as React from "react";

import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from "next-themes";

// ==========================================
// THEME PROVIDER
// ==========================================

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  );
}

// ==========================================
// CHECK WHETHER THE USER IS TYPING
// ==========================================

function isTypingTarget(
  target: EventTarget | null
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.closest(
      'input, textarea, select, [contenteditable="true"]'
    ) !== null
  );
}

// ==========================================
// KEYBOARD THEME SHORTCUT
// ==========================================
//
// Press D to switch between light and dark.
//
// Does not activate while typing inside
// inputs, textareas or editable elements.

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.defaultPrevented ||
        event.repeat
      ) {
        return;
      }

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      if (
        event.key.toLowerCase() !== "d"
      ) {
        return;
      }

      if (
        isTypingTarget(event.target)
      ) {
        return;
      }

      if (
        resolvedTheme !== "light" &&
        resolvedTheme !== "dark"
      ) {
        return;
      }

      event.preventDefault();

      setTheme(
        resolvedTheme === "dark"
          ? "light"
          : "dark"
      );
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [resolvedTheme, setTheme]);

  return null;
}
