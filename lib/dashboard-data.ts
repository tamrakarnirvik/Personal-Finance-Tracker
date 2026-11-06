
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  ChartNoAxesCombined,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type PageName =
  | "Dashboard"
  | "Transactions"
  | "Accounts"
  | "Budgets"
  | "Analytics"
  | "Settings";

export interface NavigationItem {
  name: PageName;
  icon: LucideIcon;
}

export const navigation: NavigationItem[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Transactions", icon: ArrowLeftRight },
  { name: "Accounts", icon: Wallet },
  { name: "Budgets", icon: PiggyBank },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "Settings", icon: Settings },
];

export interface SummaryItem {
  label: string;
  amount: number;
  icon: LucideIcon;
  color: string;
}

export const summary: SummaryItem[] = [
  {
    label: "Total Balance",
    amount: 87500,
    icon: Wallet,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Monthly Income",
    amount: 55000,
    icon: ArrowDownLeft,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Monthly Expenses",
    amount: 18450,
    icon: ArrowUpRight,
    color: "bg-rose-50 text-rose-600",
  },
];

export const spendingData = [
  { month: "Jun", expenses: 12000 },
  { month: "Jul", expenses: 15000 },
  { month: "Aug", expenses: 13800 },
  { month: "Sep", expenses: 19200 },
  { month: "Oct", expenses: 16400 },
  { month: "Nov", expenses: 18450 },
];

export interface Transaction {
  id: number;
  name: string;
  category: string;
  date: string;
  amount: number;
}

export const transactions: Transaction[] = [
  {
    id: 1,
    name: "Groceries",
    category: "Food & Shopping",
    date: "05 Nov 2026",
    amount: -2450,
  },
  {
    id: 2,
    name: "Monthly Salary",
    category: "Income",
    date: "04 Nov 2026",
    amount: 55000,
  },
  {
    id: 3,
    name: "Coffee",
    category: "Food & Drinks",
    date: "03 Nov 2026",
    amount: -350,
  },
  {
    id: 4,
    name: "Internet Bill",
    category: "Utilities",
    date: "02 Nov 2026",
    amount: -1500,
  },
];

export function formatMoney(amount: number) {
  return `Rs. ${Math.abs(amount).toLocaleString("en-NP")}`;
}
