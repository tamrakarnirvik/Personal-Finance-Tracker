
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  shellNavItems,
  isShellRouteActive,
} from "@/lib/shell-navigation";

const primaryItems = shellNavItems.slice(0, 4);
const secondaryItems = shellNavItems.slice(4);

export function MobileNav() {
  const pathname = usePathname();

  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = secondaryItems.some(
    (item) => isShellRouteActive(pathname, item.href)
  );

  return (
    <nav
      aria-label="Mobile navigation"
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-border
        bg-card/95
        shadow-[0_-8px_28px_rgba(17,24,39,0.04)]
        backdrop-blur-xl lg:hidden
      "
      style={{
        paddingBottom:
          "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* More menu */}
      {moreOpen && (
        <div
          id="mobile-more-menu"
          className="
            absolute bottom-[calc(100%+12px)] right-3
            w-52 rounded-2xl border border-border
            bg-card p-2 shadow-xl
          "
        >
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            More pages
          </p>

          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const active = isShellRouteActive(
              pathname,
              item.href
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl",
                  "px-3 py-3 text-sm font-medium",
                  "transition-colors duration-200",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.title}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom navigation */}
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pt-2">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isShellRouteActive(
            pathname,
            item.href
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMoreOpen(false)}
              className={[
                "flex min-w-0 flex-col items-center",
                "justify-center gap-1 rounded-xl",
                "px-1 py-2 text-[10px] font-medium",
                "transition-colors duration-200",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.1 : 1.8}
              />

              <span className="truncate">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          type="button"
          aria-label="More"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          onClick={() =>
            setMoreOpen((previous) => !previous)
          }
          className={[
            "flex min-w-0 flex-col items-center",
            "justify-center gap-1 rounded-xl",
            "px-1 py-2 text-[10px] font-medium",
            "transition-colors duration-200",
            moreActive || moreOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          ].join(" ")}
        >
          <MoreHorizontal size={20} strokeWidth={1.9} />

          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
