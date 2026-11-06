
export type AccountType =
  | "cash"
  | "bank"
  | "wallet";

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: "NPR";
  openingBalancePaisa: number;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface BaseTransaction {
  id: string;
  amountPaisa: number;
  occurredOn: string; // YYYY-MM-DD
  note?: string;
}

export type FinanceTransaction =
  | (BaseTransaction & {
      type: "income" | "expense";
      accountId: string;
      categoryId: string;
    })
  | (BaseTransaction & {
      type: "transfer";
      fromAccountId: string;
      toAccountId: string;
    });
