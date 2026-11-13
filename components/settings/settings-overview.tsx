
"use client";

import {
  Database,
  ReceiptText,
  Tags,
  Wallet,
  ShieldCheck,
} from "lucide-react";

import { useTransactions } from "@/components/transactions/transaction-provider";
import { useCategories } from "@/components/categories/category-provider";

export function SettingsOverview() {
  const { transactions, accounts } = useTransactions();
  const { categories } = useCategories();

  const items = [
    {
      title: "Transactions",
      value: transactions.length,
      description: "Financial records",
      icon: ReceiptText,
    },
    {
      title: "Accounts",
      value: accounts.length,
      description: "Cash, bank and wallets",
      icon: Wallet,
    },
    {
      title: "Categories",
      value: categories.length,
      description: "Available categories",
      icon: Tags,
    },
  ];

  return (
    <section
      aria-label="Workspace overview"
      className="space-y-5"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          Your workspace
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Financial workspace overview
        </h2>

        <p className="mt-2 text-[13px] text-muted-foreground">
          A quick summary of your existing data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="clean-panel min-w-0 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {item.title}
                </p>

                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                {item.value}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Database size={20} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Local data storage
            </h3>

            <ShieldCheck
              size={16}
              className="text-primary"
              aria-hidden="true"
            />
          </div>

          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Your financial records are stored locally in this
            browser. Export a JSON backup regularly to protect
            against accidental browser-data loss.
          </p>
        </div>
      </div>
    </section>
  );
}
