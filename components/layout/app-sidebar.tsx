
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
} from "lucide-react";

import {
  shellNavItems,
  isShellRouteActive,
} from "@/lib/shell-navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-40
        hidden w-64 flex-col
        border-r border-sidebar-border
        bg-sidebar text-sidebar-foreground
        lg:flex
      "
    >
      {/* Brand */}
      <div className="flex h-24 items-center gap-3 px-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Wallet size={21} strokeWidth={1.9} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.03em]">
            Expense Tracker
          </p>

          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            Personal finance
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 px-3 pt-8">
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </p>

        <nav
          aria-label="Main navigation"
          className="space-y-1"
        >
          {shellNavItems.map((item) => {
            const active = isShellRouteActive(
              pathname,
              item.href
            );

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "clean-transition clean-focus",
                  "group relative flex h-11 items-center",
                  "gap-3 rounded-xl px-4",
                  "text-[13px] font-medium",
                  "transition-colors duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                ].join(" ")}
              >
                {active && (

<span className="absolute inset-y-2.5 left-0 w-0.75 rounded-r-full bg-primary" />
                )}

                <Icon
                  size={18}
                  strokeWidth={active ? 2.1 : 1.8}
                  className="shrink-0"
                />

                <span className="min-w-0 truncate">
                  {item.title}
                </span>

                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Local workspace information */}
      <div className="p-4">
        <div className="rounded-2xl border border-sidebar-border bg-muted/60 p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-card text-primary">
            <ShieldCheck size={18} />
          </div>

          <p className="text-xs font-semibold">
            Local workspace
          </p>

          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Your financial records are currently
            saved in this browser.
          </p>
        </div>

        <p className="mt-4 text-center text-[10px] tracking-wide text-muted-foreground">
          EXPENSE TRACKER · DEVELOPMENT
        </p>
      </div>
    </aside>
  );
}
