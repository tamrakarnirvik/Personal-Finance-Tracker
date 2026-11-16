
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

// ==========================================
// APPLICATION METADATA
// ==========================================

export const metadata: Metadata = {
  title: "Expense Tracker 2.0",
  description:
    "Personal finance management, budgeting, recurring transactions, savings goals and financial reports.",
};

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
