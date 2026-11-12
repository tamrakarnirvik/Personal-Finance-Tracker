
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Target,
  BarChart3,
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
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
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
    pathname.startsWith(`${href}/`)
  );
}
