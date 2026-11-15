
"use client";

import {
  assertPositiveAmountPaisa,
  assertTransactionDate,
  assertTransferAllowed,
} from "@/lib/finance-integrity";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type {
  FinanceAccount,
  FinanceTransaction,
} from "@/types/finance";

// ==========================================
// TYPES
// ==========================================

export type EntryTransaction = Extract<
  FinanceTransaction,
  { type: "income" | "expense" }
>;

export type EntryDraft = Omit<
  EntryTransaction,
  "id"
>;

export type TransferDraft = Omit<
  Extract<
    FinanceTransaction,
    { type: "transfer" }
  >,
  "id"
>;

export type AccountDraft = Omit<
  FinanceAccount,
  "id" | "currency"
>;

// ==========================================
// TRANSACTION CONTEXT INTERFACE
// ==========================================

interface TransactionContextValue {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];

  saveEntry: (
    draft: EntryDraft,
    id?: string
  ) => void;

  deleteEntry: (id: string) => void;

  addAccount: (
    draft: AccountDraft
  ) => void;

  addTransfer: (
    draft: TransferDraft
  ) => void;

  // NEW: Post a recurring transaction.
  postRecurringEntry: (
    draft: EntryDraft,
    occurrenceId: string
  ) => void;
}

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

// Keep these keys unchanged.
// They contain your existing financial records.

const TRANSACTIONS_KEY =
  "expense-tracker-transactions-v1";

const ACCOUNTS_KEY =
  "expense-tracker-accounts-v1";

// ==========================================
// INITIAL ACCOUNTS
// ==========================================

const initialAccounts: FinanceAccount[] = [
  {
    id: "cash",
    name: "Cash Wallet",
    type: "cash",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
  {
    id: "bank",
    name: "Bank Account",
    type: "bank",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
  {
    id: "wallet",
    name: "Digital Wallet",
    type: "wallet",
    currency: "NPR",
    openingBalancePaisa: 0,
  },
];

// ==========================================
// INITIAL DEMO TRANSACTIONS
// ==========================================

const initialTransactions: FinanceTransaction[] = [
  {
    id: "demo-1",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 245000,
    occurredOn: "2026-11-05",
    note: "Groceries",
  },
  {
    id: "demo-2",
    type: "income",
    accountId: "cash",
    categoryId: "salary",
    amountPaisa: 5500000,
    occurredOn: "2026-11-04",
    note: "Monthly Salary",
  },
  {
    id: "demo-3",
    type: "expense",
    accountId: "cash",
    categoryId: "food",
    amountPaisa: 35000,
    occurredOn: "2026-11-03",
    note: "Coffee",
  },
  {
    id: "demo-4",
    type: "expense",
    accountId: "cash",
    categoryId: "utilities",
    amountPaisa: 150000,
    occurredOn: "2026-11-02",
    note: "Internet Bill",
  },
];

// ==========================================
// DATA VALIDATION
// ==========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ==========================================
// VALIDATE ACCOUNT
// ==========================================

function isAccount(
  value: unknown
): value is FinanceAccount {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&

    typeof value.name === "string" &&
    value.name.trim().length > 0 &&

    (
      value.type === "cash" ||
      value.type === "bank" ||
      value.type === "wallet"
    ) &&

    value.currency === "NPR" &&

    Number.isSafeInteger(
      value.openingBalancePaisa
    ) &&

    Number(value.openingBalancePaisa) >= 0
  );
}

// ==========================================
// VALIDATE ACCOUNT ARRAY
// ==========================================

function isAccountList(
  value: unknown
): value is FinanceAccount[] {
  return (
    Array.isArray(value) &&
    value.every(isAccount) &&

    new Set(
      value.map(
        (account: FinanceAccount) =>
          account.id
      )
    ).size === value.length
  );
}

// ==========================================
// VALIDATE TRANSACTION
// ==========================================

function isTransaction(
  value: unknown
): value is FinanceTransaction {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||

    !Number.isSafeInteger(
      value.amountPaisa
    ) ||

    Number(value.amountPaisa) <= 0 ||

    typeof value.occurredOn !== "string" ||

    !/^\d{4}-\d{2}-\d{2}$/.test(
      value.occurredOn
    ) ||

    (
      value.note !== undefined &&
      typeof value.note !== "string"
    )
  ) {
    return false;
  }

  // Transfer transaction validation.

  if (value.type === "transfer") {
    return (
      typeof value.fromAccountId === "string" &&
      value.fromAccountId.length > 0 &&

      typeof value.toAccountId === "string" &&
      value.toAccountId.length > 0 &&

      value.fromAccountId !== value.toAccountId
    );
  }

  // Income or expense validation.

  return (
    (
      value.type === "income" ||
      value.type === "expense"
    ) &&

    typeof value.accountId === "string" &&
    value.accountId.length > 0 &&

    typeof value.categoryId === "string" &&
    value.categoryId.length > 0
  );
}

// ==========================================
// VALIDATE TRANSACTION ARRAY
// ==========================================

function isTransactionList(
  value: unknown
): value is FinanceTransaction[] {
  return (
    Array.isArray(value) &&
    value.every(isTransaction)
  );
}

// ==========================================
// LOCAL STORAGE DATA TYPE
// ==========================================

type Loaded<T> = {
  value: T;
  error: string | null;
};

// ==========================================
// LOAD SAVED DATA
// ==========================================

// Read localStorage during state initialization.
//
// In Next.js SSR, return demo defaults.
// The provider renders a loading state during
// hydration to avoid an HTML mismatch.

function loadSaved<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T
): Loaded<T> {
  if (typeof window === "undefined") {
    return {
      value: fallback,
      error: null,
    };
  }

  try {
    const raw =
      window.localStorage.getItem(key);

    if (raw === null) {
      return {
        value: fallback,
        error: null,
      };
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!validate(parsed)) {
      return {
        value: fallback,
        error:
          `Saved data in ${key} is invalid. ` +
          "It was NOT overwritten.",
      };
    }

    return {
      value: parsed,
      error: null,
    };
  } catch (error) {
    console.error(
      `Could not read ${key}`,
      error
    );

    return {
      value: fallback,
      error:
        `Could not load ${key}. ` +
        "Existing saved data was NOT overwritten.",
    };
  }
}

// ==========================================
// HYDRATION HELPERS
// ==========================================

// React uses false on the server and during
// hydration, then true on the client.

const subscribeToHydration =
  () => () => {};

const getClientHydration =
  () => true;

const getServerHydration =
  () => false;

// ==========================================
// CREATE TRANSACTION CONTEXT
// ==========================================

const TransactionContext =
  createContext<TransactionContextValue | null>(
    null
  );

// ==========================================
// TRANSACTION PROVIDER
// ==========================================

export function TransactionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ========================================
  // INITIALIZE SAVED TRANSACTIONS
  // ========================================

  const [loadedTransactions] = useState(
    () =>
      loadSaved(
        TRANSACTIONS_KEY,
        initialTransactions,
        isTransactionList
      )
  );

  // ========================================
  // INITIALIZE SAVED ACCOUNTS
  // ========================================

  const [loadedAccounts] = useState(
    () =>
      loadSaved(
        ACCOUNTS_KEY,
        initialAccounts,
        isAccountList
      )
  );

  // ========================================
  // REACT STATE
  // ========================================

  const [
    transactions,
    setTransactions,
  ] = useState<FinanceTransaction[]>(
    loadedTransactions.value
  );

  const [
    accounts,
    setAccounts,
  ] = useState<FinanceAccount[]>(
    loadedAccounts.value
  );

  // ========================================
  // HYDRATION STATUS
  // ========================================

  const isLoaded = useSyncExternalStore(
    subscribeToHydration,
    getClientHydration,
    getServerHydration
  );

  const storageError =
    loadedTransactions.error ??
    loadedAccounts.error;

  // ========================================
  // SAVE TRANSACTIONS TO LOCAL STORAGE
  // ========================================

  useEffect(() => {
    if (!isLoaded || storageError) {
      return;
    }

    try {
      window.localStorage.setItem(
        TRANSACTIONS_KEY,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error(
        "Failed to save transactions. Please check browser storage.",
        error
      );
    }
  }, [
    transactions,
    isLoaded,
    storageError,
  ]);

  // ========================================
  // SAVE ACCOUNTS TO LOCAL STORAGE
  // ========================================

  useEffect(() => {
    if (!isLoaded || storageError) {
      return;
    }

    try {
      window.localStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify(accounts)
      );
    } catch (error) {
      console.error(
        "Failed to save accounts. Please check browser storage.",
        error
      );
    }
  }, [
    accounts,
    isLoaded,
    storageError,
  ]);

  // ========================================
  // CREATE OR EDIT NORMAL TRANSACTION
  // ========================================

  function saveEntry(
    draft: EntryDraft,
    id?: string
  ) {
    // Preserve existing financial validations.

    assertPositiveAmountPaisa(
      draft.amountPaisa
    );

    assertTransactionDate(
      draft.occurredOn
    );

    // Verify account exists.

    if (
      !accounts.some(
        (account) =>
          account.id === draft.accountId
      )
    ) {
      throw new Error(
        "Please select an existing account."
      );
    }

    // Validate amount.

    if (
      !Number.isSafeInteger(
        draft.amountPaisa
      ) ||
      draft.amountPaisa <= 0
    ) {
      throw new Error(
        "Invalid transaction amount."
      );
    }

    // Update existing transaction.

    if (id) {
      const existing = transactions.find(
        (transaction) =>
          transaction.id === id
      );

      if (
        !existing ||
        existing.type === "transfer"
      ) {
        throw new Error(
          "Transaction could not be edited."
        );
      }

      setTransactions((previous) =>
        previous.map(
          (transaction) =>
            transaction.id === id
              ? {
                  ...draft,
                  id,
                }
              : transaction
        )
      );

      return;
    }

    // Create new transaction.

    const newTransaction: EntryTransaction = {
      ...draft,
      id: crypto.randomUUID(),
    };

    setTransactions((previous) => [
      newTransaction,
      ...previous,
    ]);
  }

  // ========================================
  // NEW: POST RECURRING TRANSACTION
  // ========================================

  function postRecurringEntry(
    draft: EntryDraft,
    occurrenceId: string
  ) {
    // The recurring ID must follow this format:
    // recurring:scheduleId:YYYY-MM

    const match = occurrenceId.match(
      /^recurring:([A-Za-z0-9-]+):(\d{4}-(?:0[1-9]|1[0-2]))$/
    );

    if (!match) {
      throw new Error(
        "Invalid recurring occurrence ID."
      );
    }

    // The transaction date must belong to
    // the same month as its recurring ID.

    const occurrenceMonth = match[2];

    if (
      draft.occurredOn.slice(0, 7) !==
      occurrenceMonth
    ) {
      throw new Error(
        "Recurring transaction date does not match its scheduled month."
      );
    }

    // Accept income or expense only.
    // Transfers cannot be created using
    // the recurring posting method.

    if (
      draft.type !== "income" &&
      draft.type !== "expense"
    ) {
      throw new Error(
        "Only income and expense transactions can recur."
      );
    }

    // Preserve your existing financial
    // integrity validation functions.

    assertPositiveAmountPaisa(
      draft.amountPaisa
    );

    assertTransactionDate(
      draft.occurredOn
    );

    // Verify the selected account.

    if (
      !accounts.some(
        (account) =>
          account.id === draft.accountId
      )
    ) {
      throw new Error(
        "Please select an existing account."
      );
    }

    // Validate amount.

    if (
      !Number.isSafeInteger(
        draft.amountPaisa
      ) ||
      draft.amountPaisa <= 0
    ) {
      throw new Error(
        "Invalid recurring transaction amount."
      );
    }

    // Create a transaction with a stable ID.
    // A functional state update prevents the
    // same occurrence from being inserted
    // twice within this provider instance.

    const newTransaction: EntryTransaction = {
      ...draft,
      id: occurrenceId,
    };

    setTransactions((previous) => {
      const alreadyPosted = previous.some(
        (transaction) =>
          transaction.id === occurrenceId
      );

      if (alreadyPosted) {
        return previous;
      }

      return [
        newTransaction,
        ...previous,
      ];
    });
  }

  // ========================================
  // DELETE TRANSACTION
  // ========================================

  function deleteEntry(id: string) {
    setTransactions((previous) =>
      previous.filter(
        (transaction) =>
          transaction.id !== id ||
          transaction.type === "transfer"
      )
    );
  }

  // ========================================
  // ADD NEW ACCOUNT
  // ========================================

  function addAccount(
    draft: AccountDraft
  ) {
    const name =
      draft.name.trim();

    // Validate account name.

    if (
      !name ||
      name.length > 60
    ) {
      throw new Error(
        "Enter an account name (up to 60 characters)."
      );
    }

    // Validate opening balance.

    if (
      !Number.isSafeInteger(
        draft.openingBalancePaisa
      ) ||
      draft.openingBalancePaisa < 0
    ) {
      throw new Error(
        "Invalid opening balance."
      );
    }

    // Prevent duplicate account names.

    if (
      accounts.some(
        (account) =>
          account.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      throw new Error(
        "An account with this name already exists."
      );
    }

    // Create account.

    setAccounts((previous) => [
      ...previous,
      {
        ...draft,
        id: crypto.randomUUID(),
        name,
        currency: "NPR",
      },
    ]);
  }

  // ========================================
  // TRANSFER BETWEEN ACCOUNTS
  // ========================================

  function addTransfer(
    draft: TransferDraft
  ) {
    // Preserve your existing financial
    // integrity checks, including
    // date-aware account balances.

    assertTransferAllowed(
      accounts,
      transactions,
      draft
    );

    const newTransfer: FinanceTransaction = {
      ...draft,
      id: crypto.randomUUID(),
    };

    setTransactions((previous) => [
      newTransfer,
      ...previous,
    ]);
  }

  // ========================================
  // STORAGE ERROR
  // ========================================

  if (storageError) {
    return (
      <div
        role="alert"
        className="p-8 text-sm text-red-600"
      >
        {storageError}
      </div>
    );
  }

  // ========================================
  // HYDRATION LOADING STATE
  // ========================================

  if (!isLoaded) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading your finance data...
      </div>
    );
  }

  // ========================================
  // PROVIDER VALUE
  // ========================================

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        accounts,
        saveEntry,
        deleteEntry,
        addAccount,
        addTransfer,

        // NEW: Available to RecurringManager.
        postRecurringEntry,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useTransactions() {
  const context =
    useContext(TransactionContext);

  if (!context) {
    throw new Error(
      "useTransactions must be used inside TransactionProvider"
    );
  }

  return context;
}
