
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";

import { navItems, isActiveRoute } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <Link
        href="/dashboard"
        className="mb-12 flex items-center gap-3 rounded-xl px-3 focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <Wallet size={21} />
        </div>

        <div>
          <p className="text-base font-semibold tracking-tight">
            Expense Tracker
          </p>
          <p className="text-xs text-slate-400">
            Personal Finance
          </p>
        </div>
      </Link>

      <p className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Workspace
      </p>

      <nav aria-label="Main navigation" className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active = isActiveRoute(
            pathname,
            item.href
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-emerald-600"
                />
              )}

              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
        <p className="text-xs font-semibold">
          Expense Tracker
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your personal finance workspace
        </p>
      </div>
    </aside>
  );
}
