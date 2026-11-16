
"use client";

import Link from "next/link";

import {
  Target,
  ArrowUpRight,
} from "lucide-react";

import {
  useGoals,
} from "@/components/goals/use-goals";

import {
  getGoalProgress,
} from "@/lib/goal-planning";

import {
  formatNpr,
} from "@/lib/finance";

export function GoalsDashboardWidget() {
  const {
    workspace,
    error,
  } = useGoals();

  const goals =
    workspace.goals.slice(0, 3);

  return (
    <section
      aria-label="Savings goals summary"
      className="clean-panel space-y-4 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target
            size={19}
            className="text-primary"
          />

          <div>
            <h2 className="text-base font-semibold">
              Savings goals
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Progress toward your personal targets
            </p>
          </div>
        </div>

        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Manage goals
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No savings goals yet. Create one
          to start tracking progress.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {goals.map((goal) => {
            const progress =
              getGoalProgress(
                goal,
                workspace.movements
              );

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-border p-4"
              >
                <p className="truncate text-sm font-medium">
                  {goal.name}
                </p>

                <p className="mt-2 text-sm font-semibold tabular-nums">
                  {formatNpr(
                    progress.savedPaisa
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  of{" "}
                  {formatNpr(
                    goal.targetPaisa
                  )}
                </p>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                  aria-label={`${progress.percent}% completed`}
                >
                  <div
                    className="h-full rounded-full bg-[#146B55] transition-all duration-300"
                    style={{
                      width:
                        `${progress.percent}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {progress.percent}% allocated
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Goal allocations do not change
        your account balances.
      </p>
    </section>
  );
}
