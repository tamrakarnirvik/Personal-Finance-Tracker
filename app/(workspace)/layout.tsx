
import type {
  ReactNode,
} from "react";

import {
  TransactionProvider,
} from "@/components/transactions/transaction-provider";

import {
  CategoryProvider,
} from "@/components/categories/category-provider";

import {
  RecurringAutomationHost,
} from "@/components/recurring/recurring-automation-host";

import {
  CrossTabWarning,
} from "@/components/reliability/cross-tab-warning";

import {
  AppSidebar,
} from "@/components/layout/app-sidebar";

import {
  AppHeader,
} from "@/components/layout/app-header";

import {
  MobileNav,
} from "@/components/layout/mobile-nav";

import {
  PageTransition,
} from "@/components/layout/page-transition";

// ==========================================
// WORKSPACE LAYOUT
// ==========================================

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TransactionProvider>
      <CategoryProvider>

        {/* Both components require
            the finance workspace. */}

        <RecurringAutomationHost />

        {/* MAIN APPLICATION SHELL */}

        <div className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

          {/* ACCESSIBILITY SKIP LINK */}

          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-xl focus:border focus:border-border focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-ring"
          >
            Skip to main content
          </a>

          {/* NEW: CROSS-TAB WARNING */}

          <CrossTabWarning />

          {/* DESKTOP SIDEBAR */}

          <AppSidebar />

          {/* HEADER AND PAGE CONTENT */}

          <div className="min-w-0 lg:pl-64">
            <AppHeader />

            <main
              id="main-content"
              className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10"
            >
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>

          {/* MOBILE NAVIGATION */}

          <MobileNav />
        </div>

      </CategoryProvider>
    </TransactionProvider>
  );
}
