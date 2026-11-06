
"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  calculateAccountBalance,
  formatNpr,
  parseNprToPaisa,
} from "@/lib/finance";

import { useTransactions } from "@/components/transactions/transaction-provider";

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function TransferDialog() {
  const {
    accounts,
    transactions,
    addTransfer,
  } = useTransactions();

  const [open, setOpen] = useState(false);
  const [fromId, setFromId] = useState("cash");
  const [toId, setToId] = useState("bank");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const source = accounts.find(
    (account) => account.id === fromId
  );

  const available = source
    ? calculateAccountBalance(source, transactions)
    : 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      addTransfer({
        type: "transfer",
        fromAccountId: fromId,
        toAccountId: toId,
        amountPaisa: parseNprToPaisa(amount),
        occurredOn: date,
        note: note.trim(),
      });

      setOpen(false);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete transfer."
      );
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="gap-2"
      >
        <ArrowLeftRight size={17} />
        Transfer Money
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
            <DialogDescription>
              Move funds between your own accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="transfer-from" className="text-sm font-medium">
                From account
              </label>

              <select
                id="transfer-from"
                value={fromId}
                onChange={(event) => setFromId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500">
                Available: {formatNpr(available)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="transfer-to" className="text-sm font-medium">
                To account
              </label>

              <select
                id="transfer-to"
                value={toId}
                onChange={(event) => setToId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="transfer-amount"
                className="text-sm font-medium"
              >
                Amount (NPR)
              </label>
              <Input
                id="transfer-amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1000.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="transfer-date" className="text-sm font-medium">
                Transfer date
              </label>
              <Input
                id="transfer-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="transfer-note" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="transfer-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Wallet top-up"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Complete Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
