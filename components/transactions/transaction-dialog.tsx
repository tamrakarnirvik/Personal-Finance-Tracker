
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

import {
  useCategories,
} from "@/components/categories/category-provider";

// --------------------------------------------------
// Types
// --------------------------------------------------

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

// --------------------------------------------------
// Helper: Get today's local date
// --------------------------------------------------

function getToday(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(
    2,
    "0"
  );

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// --------------------------------------------------
// Helper: Initialize form values
// --------------------------------------------------

function createForm(
  transaction?: EntryTransaction,
  defaultAccountId = "cash"
): FormValues {
  const type: EntryType =
    transaction?.type ?? "expense";

  return {
    type,

    amount: transaction
      ? (transaction.amountPaisa / 100).toFixed(2)
      : "",

    accountId:
      transaction?.accountId ?? defaultAccountId,

    categoryId:
      transaction?.categoryId ??
      categoryOptions[type][0].id,

    occurredOn:
      transaction?.occurredOn ?? getToday(),

    note: transaction?.note ?? "",
  };
}

// --------------------------------------------------
// Transaction Dialog Component
// --------------------------------------------------

export function TransactionDialog({
  transaction,
}: TransactionDialogProps) {
  // Shared transaction and account state
  const {
    saveEntry,
    accounts,
  } = useTransactions();

  // Default and custom categories
  const {
    categoriesForType,
  } = useCategories();

  const formId = useId();

  const editing = Boolean(transaction);

  const defaultAccountId =
    accounts[0]?.id ?? "cash";

  // Dialog state
  const [open, setOpen] = useState(false);

  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState<FormValues>(
    () => createForm(transaction, defaultAccountId)
  );

  // --------------------------------------------------
  // Open dialog
  // --------------------------------------------------

  function openDialog() {
    setForm(
      createForm(transaction, defaultAccountId)
    );

    setError("");
    setOpen(true);
  }

  // --------------------------------------------------
  // Change transaction type
  // --------------------------------------------------

  function changeType(type: EntryType) {
    const availableCategories =
      categoriesForType(type);

    setForm((previous) => ({
      ...previous,
      type,

      categoryId:
        availableCategories[0]?.id ??
        categoryOptions[type][0].id,
    }));

    setError("");
  }

  // --------------------------------------------------
  // Save transaction
  // --------------------------------------------------

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    try {
      // Validate and convert NPR into paisa
      const amountPaisa = parseNprToPaisa(
        form.amount
      );

      // Validate selected category
      const categoryIsValid =
        categoriesForType(form.type).some(
          (category) =>
            category.id === form.categoryId
        );

      if (!categoryIsValid) {
        throw new Error(
          "Please select a valid category."
        );
      }

      // Validate selected account
      const accountIsValid = accounts.some(
        (account) =>
          account.id === form.accountId
      );

      if (!accountIsValid) {
        throw new Error(
          "Please select a valid account."
        );
      }

      // Validate transaction date
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          form.occurredOn
        )
      ) {
        throw new Error(
          "Please select a valid date."
        );
      }

      // Save new or edited transaction
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

      // Close dialog after successful save
      setOpen(false);

      // Clear errors
      setError("");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save transaction."
      );
    }
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <>
      {/* Open dialog button */}
      <Button
        type="button"
        variant={
          editing ? "outline" : "default"
        }
        size={
          editing ? "sm" : "default"
        }
        onClick={openDialog}
        className="gap-2"
      >
        {editing ? (
          <Pencil size={15} />
        ) : (
          <Plus size={17} />
        )}

        {editing
          ? "Edit"
          : "Add Transaction"}
      </Button>

      {/* Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        
<DialogContent className="finance-dialog max-h-[90dvh] overflow-y-auto sm:max-w-lg">

          {/* Dialog heading */}
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Edit Transaction"
                : "Add Transaction"}
            </DialogTitle>

            <DialogDescription>
              Record your income and expenses
              in Nepalese Rupees (NPR).
            </DialogDescription>
          </DialogHeader>

          {/* Transaction form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* --------------------------------
                Transaction type
            -------------------------------- */}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Transaction Type
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(
                  ["expense", "income"] as const
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={
                      form.type === type
                    }
                    onClick={() =>
                      changeType(type)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      form.type === type
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    {type === "expense"
                      ? "Expense"
                      : "Income"}
                  </button>
                ))}
              </div>
            </div>

            {/* --------------------------------
                Amount
            -------------------------------- */}

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
                  setForm((previous) => ({
                    ...previous,
                    amount: event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* --------------------------------
                Category
            -------------------------------- */}

            <div className="space-y-2">
              <label
                htmlFor={`${formId}-category`}
                className="text-sm font-medium"
              >
                Category
              </label>

              <select
                id={`${formId}-category`}
                aria-label="Category"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    categoryId:
                      event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              >
                {categoriesForType(
                  form.type
                ).map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500">
                Includes default and custom
                categories created in Settings.
              </p>
            </div>

            {/* --------------------------------
                Account selection
            -------------------------------- */}

            <div className="space-y-2">
              <label
                htmlFor={`${formId}-account`}
                className="text-sm font-medium"
              >
                Account
              </label>

              <select
                id={`${formId}-account`}
                aria-label="Account"
                value={form.accountId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    accountId:
                      event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              >
                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* --------------------------------
                Transaction date
            -------------------------------- */}

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
                  setForm((previous) => ({
                    ...previous,
                    occurredOn:
                      event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* --------------------------------
                Description
            -------------------------------- */}

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
                  setForm((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
              />
            </div>

            {/* --------------------------------
                Error message
            -------------------------------- */}

            {error && (
              <p
                role="alert"
                className="text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {/* --------------------------------
                Form actions
            -------------------------------- */}

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setOpen(false)
                }
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
