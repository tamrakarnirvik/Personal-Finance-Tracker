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
