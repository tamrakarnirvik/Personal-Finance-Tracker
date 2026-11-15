
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Target,
  Repeat2,
  BarChart3,
  Settings2,
  type LucideIcon,
} from "lucide-react";

// ==========================================
// NAVIGATION ITEM TYPE
// ==========================================

export interface ShellNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

// ==========================================
// MAIN APPLICATION NAVIGATION
// ==========================================

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

// ==========================================
// ACTIVE NAVIGATION DETECTION
// ==========================================

export function isShellRouteActive(
  pathname: string,
  href: string
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}
