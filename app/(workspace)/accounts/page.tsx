
"use client";

import {
  Wallet,
  Landmark,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { PageHeading } from "@/components/layout/page-heading";

import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { TransferDialog } from "@/components/accounts/transfer-dialog";
import { AccountsOverview } from "@/components/accounts/accounts-overview";

import {
  calculateAccountBalance,
  formatNpr,
} from "@/lib/finance";

import type { FinanceTransaction } from "@/types/finance";

import { useTransactions } from "@/components/transactions/transaction-provider";

type Transfer = Extract<
  FinanceTransaction,
  { type: "transfer" }
>;

export default function AccountsPage() {
  const { accounts, transactions } = useTransactions();

  // ==========================================
  // ACCOUNT BALANCES
  // ==========================================

  const balances = accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(
      account,
      transactions
    ),
  }));

  // ==========================================
  // TRANSFER HISTORY
  // ==========================================

  const transfers = transactions
    .filter(
      (transaction): transaction is Transfer =>
        transaction.type === "transfer"
    )
    .sort((a, b) =>
      b.occurredOn.localeCompare(a.occurredOn)
    );

  function accountName(id: string) {
    return (
      accounts.find((account) => account.id === id)?.name ??
      "Unknown Account"
    );
  }

  return (
    <div className="finance-refresh space-y-8 pb-6 sm:space-y-10">

      {/* ======================================
          PAGE HEADER
          ====================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeading
            title="Accounts"
            description="Manage your money across accounts"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TransferDialog />

          <AddAccountDialog />
        </div>
      </div>

      {/* ======================================
          ACCOUNTS OVERVIEW
          ====================================== */}

      <AccountsOverview />

      {/* ======================================
          ACCOUNT CARDS
          ====================================== */}

      <section className="space-y-4">

        {/* Section heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Your Accounts
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage and monitor your account balances.
            </p>
          </div>

          {/* Account count */}
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {accounts.length}{" "}
            {accounts.length === 1
              ? "account"
              : "accounts"}
          </span>
        </div>

        {/* Account card grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {balances.map((account) => {
            const Icon =
              account.type === "bank"
                ? Landmark
                : account.type === "wallet"
                  ? CreditCard
                  : Wallet;

            const isNegative = account.balance < 0;

            return (
              <Card
                key={account.id}
                className="finance-account-card overflow-hidden border-border bg-card shadow-sm"
              >
                <CardContent className="p-5 sm:p-6">

                  {/* Account icon and type */}
                  <div className="mb-6 flex items-center justify-between gap-3">

                    <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon
                        size={21}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                      {account.type}
                    </span>
                  </div>

                  {/* Account details */}
                  <div className="space-y-2">

                    <p className="truncate text-sm font-medium text-muted-foreground">
                      {account.name}
                    </p>

                    <h3
                      className={`wrap-break-word text-[27px] font-semibold tracking-tight tabular-nums ${
                        isNegative
                          ? "text-red-600 dark:text-red-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatNpr(account.balance)}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Available balance
                    </p>

                  </div>

                  {/* Opening balance */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">

                    <span className="text-xs text-muted-foreground">
                      Opening balance
                    </span>

                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatNpr(
                        account.openingBalancePaisa
                      )}
                    </span>

                  </div>

                </CardContent>
              </Card>
            );
          })}

        </div>

        {/* Empty account state */}
        {balances.length === 0 && (
          <div className="clean-panel px-6 py-12 text-center">

            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Wallet
                size={25}
                className="text-muted-foreground"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              No accounts yet
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Add your first account to start managing
              your money.
            </p>

          </div>
        )}

      </section>

      {/* ======================================
          RECENT TRANSFERS
          ====================================== */}

      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-5 sm:p-6">

          {/* Section header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                <ArrowLeftRight
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Recent Transfers
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Money moved between your accounts
                </p>
              </div>

            </div>

            {/* Transfer count */}
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {transfers.length}{" "}
              {transfers.length === 1
                ? "transfer"
                : "transfers"}
            </span>

          </div>

          {/* Empty transfer history */}
          {transfers.length === 0 ? (

            <div className="flex flex-col items-center justify-center py-10 text-center">

              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
                <ArrowLeftRight
                  size={21}
                  className="text-muted-foreground"
                />
              </div>

              <p className="text-sm font-semibold text-foreground">
                No transfers recorded yet
              </p>

              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                When you transfer money between
                accounts, the history will appear here.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-border">

              {transfers.map((transfer) => (

                <div
                  key={transfer.id}
                  className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >

                  {/* Transfer details */}
                  <div className="flex min-w-0 items-start gap-3">

                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <ArrowLeftRight
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="min-w-0">

                      <p className="wrap-break-word text-sm font-medium text-foreground">
                        {accountName(
                          transfer.fromAccountId
                        )}

                        {" → "}

                        {accountName(
                          transfer.toAccountId
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {transfer.occurredOn}
                      </p>

                      {transfer.note && (
                        <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
                          {transfer.note}
                        </p>
                      )}

                    </div>

                  </div>

                  {/* Transfer amount */}
                  <div className="pl-13 sm:pl-0 sm:text-right">

                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatNpr(
                        transfer.amountPaisa
                      )}
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Internal transfer
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </CardContent>
      </Card>

      {/* ======================================
          INFORMATION FOOTER
          ====================================== */}

      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">

        <p className="text-xs leading-relaxed text-muted-foreground">
          Account balances are calculated from opening
          balances, income, expenses, and transfers.
          Transfers move money between accounts and
          do not increase total income or expenses.
        </p>

      </div>

    </div>
  );
}
