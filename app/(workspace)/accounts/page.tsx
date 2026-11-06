
"use client";

import {
  Wallet,
  Landmark,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { TransferDialog } from "@/components/accounts/transfer-dialog";

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

  const balances = accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, transactions),
  }));

  const totalBalance = balances.reduce(
    (sum, account) => sum + account.balance,
    0
  );

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
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Accounts"
          description="Manage your money across accounts"
        />

        <div className="flex flex-wrap gap-2">
          <TransferDialog />
          <AddAccountDialog />
        </div>
      </div>

      {/* Combined balance */}
      <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="p-6">
          <p className="text-sm text-slate-500">
            Total Balance Across All Accounts
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {formatNpr(totalBalance)}
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Across {accounts.length} accounts
          </p>
        </CardContent>
      </Card>

      {/* Account cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {balances.map((account) => {
          const Icon =
            account.type === "bank"
              ? Landmark
              : account.type === "wallet"
                ? CreditCard
                : Wallet;

          return (
            <Card
              key={account.id}
              className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800"
            >
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon size={21} />
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {account.type}
                  </span>
                </div>

                <p className="text-sm font-medium">
                  {account.name}
                </p>

                <h3 className="mt-2 text-2xl font-semibold">
                  {formatNpr(account.balance)}
                </h3>

                <p className="mt-3 text-xs text-slate-500">
                  Opening balance:{" "}
                  {formatNpr(account.openingBalancePaisa)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transfer history */}
      <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <ArrowLeftRight size={19} />
            <h2 className="text-lg font-semibold">
              Recent Transfers
            </h2>
          </div>

          {transfers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No transfers recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {accountName(transfer.fromAccountId)}
                      {" → "}
                      {accountName(transfer.toAccountId)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {transfer.occurredOn}
                      {transfer.note
                        ? ` · ${transfer.note}`
                        : ""}
                    </p>
                  </div>

                  <span className="text-sm font-semibold">
                    {formatNpr(transfer.amountPaisa)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Account balances are calculated from opening balances,
        income, expenses, and transfers. Transfers do not
        increase total income or expenses.
      </p>
    </div>
  );
}
