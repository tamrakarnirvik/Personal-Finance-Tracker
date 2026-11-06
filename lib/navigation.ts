
import { navigation } from "@/lib/dashboard-data";

export const navItems = navigation.map((item) => ({
  ...item,
  href:
    item.name === "Dashboard"
      ? "/dashboard"
      : `/${item.name.toLowerCase()}`,
}));

export function isActiveRoute(
  pathname: string,
  href: string
) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}
