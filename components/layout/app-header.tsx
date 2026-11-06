
"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems, isActiveRoute } from "@/lib/navigation";

export function AppHeader() {
  const pathname = usePathname();

  const currentPage =
    navItems.find((item) =>
      isActiveRoute(pathname, item.href)
    )?.name ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:px-6 lg:h-20 lg:px-8">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal Finance
        </p>

        <h2 className="truncate text-sm font-semibold sm:text-base">
          {currentPage}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300 sm:inline-flex">
          Demo Data
        </span>

        <ThemeToggle />

        <div
          aria-label="Demo profile"
          className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          ET
        </div>
      </div>
    </header>
  );
}
