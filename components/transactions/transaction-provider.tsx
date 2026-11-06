"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { FinanceAccount, FinanceTransaction } from "@/types/finance";
import { calculateAccountBalance } from "@/lib/finance";

export type EntryTransaction = Extract<
  FinanceTransaction,
  { type: "income" | "expense" }
>;
export type EntryDraft = Omit<EntryTransaction, "id">;
export type TransferDraft = Omit<
  Extract<FinanceTransaction, { type: "transfer" }>,
  "id"
>;
export type AccountDraft = Omit<FinanceAccount, "id" | "currency">;

interface TransactionContextValue {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  saveEntry: (draft: EntryDraft, id?: string) => void;
  deleteEntry: (id: string) => void;
  addAccount: (draft: AccountDraft) => void;
  addTransfer: (draft: TransferDraft) => void;
}

// Keep these keys unchanged: they contain your existing browser records.
const TRANSACTIONS_KEY = "expense-tracker-transactions-v1";
const ACCOUNTS_KEY = "expense-tracker-accounts-v1";

const initialAccounts: FinanceAccount[] = [
  { id: "cash", name: "Cash Wallet", type: "cash", currency: "NPR", openingBalancePaisa: 0 },
  { id: "bank", name: "Bank Account", type: "bank", currency: "NPR", openingBalancePaisa: 0 },
  { id: "wallet", name: "Digital Wallet", type: "wallet", currency: "NPR", openingBalancePaisa: 0 },
];

const initialTransactions: FinanceTransaction[] = [
  { id: "demo-1", type: "expense", accountId: "cash", categoryId: "food", amountPaisa: 245000, occurredOn: "2026-11-05", note: "Groceries" },
  { id: "demo-2", type: "income", accountId: "cash", categoryId: "salary", amountPaisa: 5500000, occurredOn: "2026-11-04", note: "Monthly Salary" },
  { id: "demo-3", type: "expense", accountId: "cash", categoryId: "food", amountPaisa: 35000, occurredOn: "2026-11-03", note: "Coffee" },
  { id: "demo-4", type: "expense", accountId: "cash", categoryId: "utilities", amountPaisa: 150000, occurredOn: "2026-11-02", note: "Internet Bill" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAccount(value: unknown): value is FinanceAccount {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" && value.id.length > 0 &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    (value.type === "cash" || value.type === "bank" || value.type === "wallet") &&
    value.currency === "NPR" &&
    Number.isSafeInteger(value.openingBalancePaisa) &&
    Number(value.openingBalancePaisa) >= 0
  );
}

function isAccountList(value: unknown): value is FinanceAccount[] {
  return (
    Array.isArray(value) &&
    value.every(isAccount) &&
    new Set(value.map((account: FinanceAccount) => account.id)).size === value.length
  );
}

function isTransaction(value: unknown): value is FinanceTransaction {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" || value.id.length === 0 ||
    !Number.isSafeInteger(value.amountPaisa) || Number(value.amountPaisa) <= 0 ||
    typeof value.occurredOn !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.occurredOn) ||
    (value.note !== undefined && typeof value.note !== "string")
  ) return false;

  if (value.type === "transfer") {
    return (
      typeof value.fromAccountId === "string" && value.fromAccountId.length > 0 &&
      typeof value.toAccountId === "string" && value.toAccountId.length > 0 &&
      value.fromAccountId !== value.toAccountId
    );
  }
  return (
    (value.type === "income" || value.type === "expense") &&
    typeof value.accountId === "string" && value.accountId.length > 0 &&
    typeof value.categoryId === "string" && value.categoryId.length > 0
  );
}

function isTransactionList(value: unknown): value is FinanceTransaction[] {
  return Array.isArray(value) && value.every(isTransaction);
}

type Loaded<T> = { value: T; error: string | null };

// Read localStorage during state initialization, not inside useEffect.
// In Next.js SSR, return demo defaults; the provider renders a loading
// state until the client has hydrated, avoiding an HTML mismatch.
function loadSaved<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T
): Loaded<T> {
  if (typeof window === "undefined") return { value: fallback, error: null };

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { value: fallback, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) {
      return {
        value: fallback,
        error: `Saved data in ${key} is invalid. It was NOT overwritten.`,
      };
    }
    return { value: parsed, error: null };
  } catch (error) {
    console.error(`Could not read ${key}`, error);
    return {
      value: fallback,
      error: `Could not load ${key}. Existing saved data was NOT overwritten.`,
    };
  }
}

// React uses false while rendering on the server and while hydrating.
// It becomes true in the browser, without setState inside useEffect.
const subscribeToHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [loadedTransactions] = useState(() =>
    loadSaved(TRANSACTIONS_KEY, initialTransactions, isTransactionList)
  );
  const [loadedAccounts] = useState(() =>
    loadSaved(ACCOUNTS_KEY, initialAccounts, isAccountList)
  );
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(
    loadedTransactions.value
  );
  const [accounts, setAccounts] = useState<FinanceAccount[]>(loadedAccounts.value);

  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getClientHydration,
    getServerHydration
  );
  const storageError = loadedTransactions.error ?? loadedAccounts.error;

  // Effects synchronize *outward* to browser storage, without calling setState.
  useEffect(() => {
    if (!isLoaded || storageError) return;
    try {
      window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transactions. Please check browser storage.", error);
    }
  }, [transactions, isLoaded, storageError]);

  useEffect(() => {
    if (!isLoaded || storageError) return;
    try {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error("Failed to save accounts. Please check browser storage.", error);
    }
  }, [accounts, isLoaded, storageError]);

  function saveEntry(draft: EntryDraft, id?: string) {
    if (!accounts.some((account) => account.id === draft.accountId)) {
      throw new Error("Please select an existing account.");
    }
    if (!Number.isSafeInteger(draft.amountPaisa) || draft.amountPaisa <= 0) {
      throw new Error("Invalid transaction amount.");
    }

    if (id) {
      const existing = transactions.find((transaction) => transaction.id === id);
      if (!existing || existing.type === "transfer") {
        throw new Error("Transaction could not be edited.");
      }
      setTransactions((previous) => previous.map((transaction) =>
        transaction.id === id ? { ...draft, id } : transaction
      ));
      return;
    }
    const newTransaction: EntryTransaction = { ...draft, id: crypto.randomUUID() };
    setTransactions((previous) => [newTransaction, ...previous]);
  }

  function deleteEntry(id: string) {
    setTransactions((previous) => previous.filter((transaction) =>
      transaction.id !== id || transaction.type === "transfer"
    ));
  }

  function addAccount(draft: AccountDraft) {
    const name = draft.name.trim();
    if (!name || name.length > 60) {
      throw new Error("Enter an account name (up to 60 characters).");
    }
    if (!Number.isSafeInteger(draft.openingBalancePaisa) || draft.openingBalancePaisa < 0) {
      throw new Error("Invalid opening balance.");
    }
    if (accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("An account with this name already exists.");
    }
    setAccounts((previous) => [...previous, {
      ...draft, id: crypto.randomUUID(), name, currency: "NPR",
    }]);
  }

  function addTransfer(draft: TransferDraft) {
    const source = accounts.find((account) => account.id === draft.fromAccountId);
    const destination = accounts.find((account) => account.id === draft.toAccountId);
    if (!source || !destination) {
      throw new Error("Select valid source and destination accounts.");
    }
    if (source.id === destination.id) {
      throw new Error("Choose two different accounts.");
    }
    if (!Number.isSafeInteger(draft.amountPaisa) || draft.amountPaisa <= 0) {
      throw new Error("Invalid transfer amount.");
    }
    const available = calculateAccountBalance(source, transactions);
    if (draft.amountPaisa > available) {
      throw new Error("Insufficient balance in the source account.");
    }
    setTransactions((previous) => [{ ...draft, id: crypto.randomUUID() }, ...previous]);
  }

  if (storageError) {
    return <div role="alert" className="p-8 text-sm text-red-600">{storageError}</div>;
  }
  if (!isLoaded) {
    return <div className="p-8 text-sm text-slate-500">Loading your finance data...</div>;
  }

  return (
    <TransactionContext.Provider value={{
      transactions,
      accounts,
      saveEntry,
      deleteEntry,
      addAccount,
      addTransfer,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransactions must be used inside TransactionProvider");
  return context;
}
