
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";

import { navItems, isActiveRoute } from "@/lib/navigation";

const mainPages = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/budgets",
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = navItems.filter((item) =>
    mainPages.includes(item.href)
  );

  const extraItems = navItems.filter(
    (item) => !mainPages.includes(item.href)
  );

  const moreActive = extraItems.some((item) =>
    isActiveRoute(pathname, item.href)
  );

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Close additional navigation"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          />

          <div
            id="mobile-more-navigation"
            aria-label="Additional pages"
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:hidden"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-semibold">
                More pages
              </p>

              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {extraItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(
                pathname,
                item.href
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                    active
                      ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-1 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-5px_25px_rgba(0,0,0,0.03)] backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(
            pathname,
            item.href
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                active
                  ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((value) => !value)}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-navigation"
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
            moreOpen || moreActive
              ? "bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
