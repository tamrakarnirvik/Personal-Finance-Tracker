
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { FinanceCategory } from "@/types/finance";
import { categoryOptions } from "@/lib/transaction-categories";
import { useTransactions } from "@/components/transactions/transaction-provider";

type CategoryType = "income" | "expense";

interface CategoryContextValue {
  categories: FinanceCategory[];
  categoriesForType: (type: CategoryType) => FinanceCategory[];
  getCategoryName: (id: string) => string;
  isCustomCategory: (id: string) => boolean;
  addCategory: (type: CategoryType, name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

const STORAGE_KEY = "expense-tracker-custom-categories-v1";

const defaultCategories: FinanceCategory[] = [
  ...categoryOptions.expense.map((category) => ({
    ...category,
    type: "expense" as const,
  })),
  ...categoryOptions.income.map((category) => ({
    ...category,
    type: "income" as const,
  })),
];

function isCategory(value: unknown): value is FinanceCategory {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    item.name.length <= 40 &&
    (item.type === "income" || item.type === "expense")
  );
}

function loadCategories(): {
  items: FinanceCategory[];
  error: string | null;
} {
  if (typeof window === "undefined") {
    return { items: [], error: null };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return { items: [], error: null };
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed) || !parsed.every(isCategory)) {
      throw new Error("Invalid saved categories.");
    }

    const ids = new Set<string>();
    const names = new Set(
      defaultCategories.map(
        (item) => `${item.type}:${item.name.toLowerCase()}`
      )
    );

    for (const item of parsed) {
      const nameKey =
        `${item.type}:${item.name.trim().toLowerCase()}`;

      if (
        ids.has(item.id) ||
        defaultCategories.some((c) => c.id === item.id) ||
        names.has(nameKey)
      ) {
        throw new Error("Duplicate or conflicting categories.");
      }

      ids.add(item.id);
      names.add(nameKey);
    }

    return { items: parsed, error: null };
  } catch {
    return {
      items: [],
      error:
        "Saved categories could not be loaded. Your existing browser data has not been overwritten.",
    };
  }
}

// Hydration-safe browser detection.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const CategoryContext =
  createContext<CategoryContextValue | null>(null);

function LoadedCategoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { transactions } = useTransactions();

  const [loaded] = useState(loadCategories);
  const [customCategories, setCustomCategories] =
    useState<FinanceCategory[]>(loaded.items);

  const categories = useMemo(
    () => [...defaultCategories, ...customCategories],
    [customCategories]
  );

  function persist(next: FinanceCategory[]) {
    // Save first. Don't change React state if storage fails.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setCustomCategories(next);
  }

  function validateName(
    type: CategoryType,
    name: string,
    excludeId?: string
  ) {
    const cleanName = name.trim();

    if (!cleanName || cleanName.length > 40) {
      throw new Error(
        "Category name must contain 1 to 40 characters."
      );
    }

    const duplicate = categories.some(
      (category) =>
        category.id !== excludeId &&
        category.type === type &&
        category.name.toLowerCase() ===
          cleanName.toLowerCase()
    );

    if (duplicate) {
      throw new Error("This category already exists.");
    }

    return cleanName;
  }

  function addCategory(type: CategoryType, name: string) {
    const cleanName = validateName(type, name);

    persist([
      ...customCategories,
      {
        id: crypto.randomUUID(),
        name: cleanName,
        type,
      },
    ]);
  }

  function renameCategory(id: string, name: string) {
    const existing = customCategories.find(
      (category) => category.id === id
    );

    if (!existing) {
      throw new Error("Only custom categories can be renamed.");
    }

    const cleanName = validateName(
      existing.type,
      name,
      id
    );

    persist(
      customCategories.map((category) =>
        category.id === id
          ? { ...category, name: cleanName }
          : category
      )
    );
  }

  function deleteCategory(id: string) {
    if (!customCategories.some((category) => category.id === id)) {
      throw new Error("Only custom categories can be deleted.");
    }

    const inUse = transactions.some(
      (transaction) =>
        transaction.type !== "transfer" &&
        transaction.categoryId === id
    );

    if (inUse) {
      throw new Error(
        "This category is used by existing transactions. Rename it instead."
      );
    }

    persist(
      customCategories.filter((category) => category.id !== id)
    );
  }

  function getCategoryName(id: string) {
    return (
      categories.find((category) => category.id === id)
        ?.name ?? "Uncategorized"
    );
  }

  function categoriesForType(type: CategoryType) {
    return categories.filter((category) => category.type === type);
  }

  function isCustomCategory(id: string) {
    return customCategories.some(
      (category) => category.id === id
    );
  }

  if (loaded.error) {
    return (
      <div role="alert" className="p-8 text-sm text-red-600">
        {loaded.error}
      </div>
    );
  }

  return (
    <CategoryContext.Provider
      value={{
        categories,
        categoriesForType,
        getCategoryName,
        isCustomCategory,
        addCategory,
        renameCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function CategoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!hydrated) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading categories...
      </div>
    );
  }

  return (
    <LoadedCategoryProvider>
      {children}
    </LoadedCategoryProvider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error(
      "useCategories must be used inside CategoryProvider"
    );
  }

  return context;
}
