
"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { parseNprToPaisa } from "@/lib/finance";
import type { AccountType } from "@/types/finance";
import { useTransactions } from "@/components/transactions/transaction-provider";

export function AddAccountDialog() {
  const { addAccount } = useTransactions();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("wallet");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const value = openingBalance.trim();

      const openingBalancePaisa =
        /^0+(?:\.0{1,2})?$/.test(value)
          ? 0
          : parseNprToPaisa(value);

      addAccount({
        name,
        type,
        openingBalancePaisa,
      });

      setOpen(false);
      setName("");
      setType("wallet");
      setOpeningBalance("0");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add account."
      );
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="gap-2"
      >
        <Plus size={17} />
        Add Account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Create a cash, bank, or digital wallet account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="account-name" className="text-sm font-medium">
                Account name
              </label>
              <Input
                id="account-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. eSewa"
                maxLength={60}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="account-type" className="text-sm font-medium">
                Account type
              </label>
              <select
                id="account-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as AccountType)
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="wallet">Digital Wallet</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="opening-balance"
                className="text-sm font-medium"
              >
                Opening balance (NPR)
              </label>
              <Input
                id="opening-balance"
                type="text"
                inputMode="decimal"
                value={openingBalance}
                onChange={(event) =>
                  setOpeningBalance(event.target.value)
                }
                required
              />
              <p className="text-xs text-slate-500">
                Enter 0 for an empty account.
              </p>
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
              <Button type="submit">Save Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
