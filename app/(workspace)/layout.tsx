import { CategoryProvider } from "@/components/categories/category-provider"
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";

import { TransactionProvider } from "@/components/transactions/transaction-provider";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TransactionProvider>
      <CategoryProvider>
      <div className="min-h-dvh overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-xl focus:border focus:border-border focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-ring"
  >
    Skip to main content
  </a>
        <AppSidebar />

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

        <MobileNav />
      </div>
      </CategoryProvider>
    </TransactionProvider>
  );
}
