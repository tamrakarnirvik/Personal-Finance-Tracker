
export type EntryType = "income" | "expense";

export const categoryOptions: Record<
  EntryType,
  { id: string; name: string }[]
> = {
  expense: [
    { id: "food", name: "Food & Drinks" },
    { id: "shopping", name: "Shopping" },
    { id: "transport", name: "Transportation" },
    { id: "utilities", name: "Utilities" },
    { id: "rent", name: "Rent" },
    { id: "health", name: "Health" },
    { id: "other-expense", name: "Other Expenses" },
  ],

  income: [
    { id: "salary", name: "Salary" },
    { id: "freelance", name: "Freelance" },
    { id: "business", name: "Business" },
    { id: "gift", name: "Gift" },
    { id: "other-income", name: "Other Income" },
  ],
};

export function getCategoryName(id: string) {
  const allCategories = [
    ...categoryOptions.expense,
    ...categoryOptions.income,
  ];

  return (
    allCategories.find((category) => category.id === id)
      ?.name ?? "Uncategorized"
  );
}
