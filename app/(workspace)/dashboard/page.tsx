
"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/layout/page-heading";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

import { summary } from "@/lib/dashboard-data";

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      {/* Heading and action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Dashboard"
          description="Your financial overview"
        />

        <Button
          disabled
          title="Available when we build transaction management"
          className="gap-2"
        >
          <Plus size={17} />
          Add Transaction
        </Button>
      </div>

      {/* Financial summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.07,
            }}
          >
            <SummaryCard item={item} />
          </motion.div>
        ))}
      </div>

      {/* Spending chart */}
      <SpendingChart />

      {/* Transaction preview */}
      <RecentTransactions />
    </div>
  );
}
