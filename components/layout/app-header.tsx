
"use client";

import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { shellNavItems } from "@/lib/shell-navigation";

export function AppHeader() {
  const pathname = usePathname();

  const currentPage =
    shellNavItems.find(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    )?.title ?? "Workspace";

  return (
    <header
      className="
        sticky top-0 z-30
        border-b border-border
        bg-background/90
        backdrop-blur-xl
      "
    >
      
<div className="mx-auto flex h-19 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">

        {/* Page context */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="hidden sm:inline">
              Personal Finance
            </span>

            <span className="hidden text-border sm:inline">
              /
            </span>

            <span className="truncate">
              {currentPage}
            </span>
          </div>

          <p 
className="mt-1 truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
>
            {currentPage}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground sm:inline-flex">
            NPR
          </span>

          {/* Existing working light/dark mode control */}
          <ThemeToggle />

          <div
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
            aria-label="Personal workspace"
            title="Personal workspace"
          >
            <CircleUserRound
              size={19}
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
