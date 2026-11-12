
"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "./category-provider";

type CategoryType = "income" | "expense";

export function CategoryManager() {
  const {
    categories,
    isCustomCategory,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useCategories();

  const [type, setType] = useState<CategoryType>("expense");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visibleCategories = categories.filter(
    (category) => category.type === type
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        renameCategory(editingId, name);
      } else {
        addCategory(type, name);
      }

      setName("");
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category."
      );
    }
  }

  function startEditing(id: string) {
    const category = categories.find((item) => item.id === id);
    if (!category) return;

    setType(category.type);
    setName(category.name);
    setEditingId(id);
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setError("");
  }

  function removeCategory(id: string) {
    if (!window.confirm("Delete this custom category?")) return;

    setError("");

    try {
      deleteCategory(id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Manage Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize your income and expenses.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={editingId !== null}
              aria-pressed={type === item}
              onClick={() => {
                setType(item);
                setError("");
                setName("");
              }}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                type === item
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {item === "expense"
                ? "Expense Categories"
                : "Income Categories"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <label
              htmlFor="custom-category-name"
              className="text-sm font-medium"
            >
              Category name
            </label>

            <Input
              id="custom-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Education"
              maxLength={40}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? (
                <Pencil size={16} />
              ) : (
                <Plus size={16} />
              )}

              {editingId ? "Save changes" : "Save category"}
            </Button>

            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                aria-label="Cancel editing"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </form>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleCategories.map((category) => {
            const custom = isCustomCategory(category.id);

            return (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {category.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {custom ? "Custom category" : "Default category"}
                  </p>
                </div>

                {custom && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(category.id)}
                      aria-label={`Rename ${category.name}`}
                    >
                      <Pencil size={15} />
                      Rename
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeCategory(category.id)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Default categories cannot be edited. A custom
          category used by transactions can be renamed,
          but not deleted.
        </p>
      </CardContent>
    </Card>
  );
}
