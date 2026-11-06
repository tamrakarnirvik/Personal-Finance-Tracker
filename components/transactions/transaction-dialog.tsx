
"use client";

import { useId, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";

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
import {
  categoryOptions,
  type EntryType,
} from "@/lib/transaction-categories";

import {
  useTransactions,
  type EntryTransaction,
} from "@/components/transactions/transaction-provider";

interface TransactionDialogProps {
  transaction?: EntryTransaction;
}


interface FormValues {
  type: EntryType;
  amount: string;
  accountId: string;
  categoryId: string;
  occurredOn: string;
  note: string;
}


function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createForm(
  transaction?: EntryTransaction
): FormValues {
  const type = transaction?.type ?? "expense";

  return {
    type,accountId: transaction?.accountId ?? "cash",
    amount: transaction
      ? (transaction.amountPaisa / 100).toFixed(2)
      : "",
    categoryId:
      transaction?.categoryId ??
      categoryOptions[type][0].id,
    occurredOn: transaction?.occurredOn ?? getToday(),
    note: transaction?.note ?? "",
  };
}

export function TransactionDialog({
  transaction,
}: TransactionDialogProps) {
  
const { saveEntry, accounts } = useTransactions();


  const formId = useId();
  const editing = Boolean(transaction);

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormValues>(() =>
    createForm(transaction)
  );

  function openDialog() {
    setForm(createForm(transaction));
    setError("");
    setOpen(true);
  }

  function changeType(type: EntryType) {
    setForm((previous) => ({
      ...previous,
      type,
      categoryId: categoryOptions[type][0].id,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const amountPaisa = parseNprToPaisa(form.amount);

      const categoryIsValid = categoryOptions[
        form.type
      ].some((category) => category.id === form.categoryId);

      if (!categoryIsValid) {
        throw new Error("Please select a valid category.");
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.occurredOn)) {
        throw new Error("Please select a valid date.");
      }

      saveEntry(
        {
          type: form.type,
          amountPaisa,
          accountId: form.accountId,
          categoryId: form.categoryId,
          occurredOn: form.occurredOn,
          note: form.note.trim(),
        },
        transaction?.id
      );

      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save transaction."
      );
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={editing ? "outline" : "default"}
        size={editing ? "sm" : "default"}
        onClick={openDialog}
        className="gap-2"
      >
        {editing ? (
          <Pencil size={15} />
        ) : (
          <Plus size={17} />
        )}

        {editing ? "Edit" : "Add Transaction"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>

            <DialogDescription>
              Record your income and expenses in NPR.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction type */}
            <div>
              <p className="mb-2 text-sm font-medium">
                Transaction Type
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={form.type === type}
                      onClick={() => changeType(type)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        form.type === type
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "border-slate-200 text-slate-500 dark:border-slate-700"
                      }`}
                    >
                      {type === "expense" ? "Expense" : "Income"}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label
                htmlFor={`${formId}-amount`}
                className="text-sm font-medium"
              >
                Amount (NPR)
              </label>

              <Input
                id={`${formId}-amount`}
                type="text"
                inputMode="decimal"
                placeholder="e.g. 1250.50"
                value={form.amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    amount: event.target.value,
                  })
                }
                required
              />
            </div>

            {/* Category */}
{/* Account selection */}
<div className="space-y-2">
  <label
    htmlFor={`${formId}-account`}
    className="text-sm font-medium"
  >
    Account
  </label>

  <select
    id={`${formId}-account`}
    value={form.accountId}
    onChange={(event) =>
      setForm({
        ...form,
        accountId: event.target.value,
      })
    }
    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    required
  >
    {accounts.map((account) => (
      <option key={account.id} value={account.id}>
        {account.name}
      </option>
    ))}
  </select>
</div>


            {/* Date */}
            <div className="space-y-2">
              <label
                htmlFor={`${formId}-date`}
                className="text-sm font-medium"
              >
                Date
              </label>

              <Input
                id={`${formId}-date`}
                type="date"
                value={form.occurredOn}
                onChange={(event) =>
                  setForm({
                    ...form,
                    occurredOn: event.target.value,
                  })
                }
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label
                htmlFor={`${formId}-note`}
                className="text-sm font-medium"
              >
                Description (optional)
              </label>

              <Input
                id={`${formId}-note`}
                placeholder="e.g. Lunch at restaurant"
                value={form.note}
                maxLength={120}
                onChange={(event) =>
                  setForm({
                    ...form,
                    note: event.target.value,
                  })
                }
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit">
                {editing
                  ? "Update Transaction"
                  : "Save Transaction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
