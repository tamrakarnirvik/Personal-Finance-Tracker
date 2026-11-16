
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Target,
  Repeat2,
  PiggyBank,
  BarChart3,
  FileText,
  TrendingUp,
  ShieldCheck,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export interface ShellNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const shellNavItems: ShellNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },

  {
    title: "Accounts",
    href: "/accounts",
    icon: Wallet,
  },

  {
    title: "Budgets",
    href: "/budgets",
    icon: Target,
  },

  {
    title: "Recurring",
    href: "/recurring",
    icon: Repeat2,
  },

  {
    title: "Goals",
    href: "/goals",
    icon: PiggyBank,
  },

  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },

  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },

  {
    title: "Insights",
    href: "/insights",
    icon: TrendingUp,
  },

  {
    title: "Data Health",
    href: "/data-health",
    icon: ShieldCheck,
  },

  {
    title: "Settings",
    href: "/settings",
    icon: Settings2,
  },
];

export function isShellRouteActive(
  pathname: string,
  href: string
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}
