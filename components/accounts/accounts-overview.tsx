
"use client";

import { useMemo } from "react";
import {
  ArrowLeftRight,
  Landmark,
  Wallet,
} from "lucide-react";

import { useTransactions } from "@/components/transactions/transaction-provider";

import {
  calculateAccountBalance,
  formatNpr,
} from "@/lib/finance";

export function AccountsOverview() {
  const { accounts, transactions } = useTransactions();

  const balances = useMemo(
    () =>
      accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balancePaisa: calculateAccountBalance(
          account,
          transactions
        ),
      })),
    [accounts, transactions]
  );

  const totalBalancePaisa = balances.reduce(
    (sum, account) => sum + account.balancePaisa,
    0
  );

  const positiveTotal = balances.reduce(
    (sum, account) =>
      sum + Math.max(0, account.balancePaisa),
    0
  );

  return (
    <section
      aria-label="Account balance overview"
      className="grid gap-4 lg:grid-cols-[1.05fr_1fr]"
    >
      {/* Primary balance card */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#146B55] p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full border border-white/15"
        />

        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-white/80">
              Total account balance
            </p>

            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
              <Wallet size={19} />
            </div>
          </div>

          <p className="mt-8 wrap-break-word text-[30px] font-semibold tracking-tight tabular-nums sm:text-[38px]">
            {formatNpr(totalBalancePaisa)}
          </p>

          <p className="mt-2 text-xs text-white/70">
            Your combined balance in Nepalese Rupees
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
            <div>
              <p className="text-xs text-white/70">
                Accounts
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {accounts.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/70">
                Currency
              </p>
              <p className="mt-2 text-xl font-semibold">
                NPR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio distribution */}
      <div className="clean-panel min-w-0 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Account distribution
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Share of positive account balances
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
            <Landmark size={19} />
          </div>
        </div>

        {balances.length > 0 ? (
          <div className="mt-6 max-h-64 space-y-5 overflow-y-auto pr-1">
            {balances.map((account) => {
              const percentage =
                positiveTotal > 0
                  ? Math.round(
                      (Math.max(0, account.balancePaisa) /
                        positiveTotal) *
                        100
                    )
                  : 0;

              return (
                <div key={account.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {account.name}
                      </p>

                      <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
                        {account.type}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-semibold tabular-nums">
                      {percentage}%
                    </p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p
                    className={`mt-1.5 text-right text-xs tabular-nums ${
                      account.balancePaisa < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatNpr(account.balancePaisa)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center">
            <Wallet
              size={24}
              className="mx-auto text-muted-foreground"
            />

            <p className="mt-3 text-sm font-medium">
              No accounts yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Your account distribution will appear here.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <ArrowLeftRight size={15} />
          Transfers move money between accounts
        </div>
      </div>
    </section>
  );
}
