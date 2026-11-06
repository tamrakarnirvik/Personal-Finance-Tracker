
import {
  Wallet,
  Landmark,
  CreditCard,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { formatMoney } from "@/lib/dashboard-data";

const accounts = [
  {
    name: "Cash Wallet",
    type: "Cash",
    balance: 15000,
    icon: Wallet,
  },
  {
    name: "Bank Account",
    type: "Bank",
    balance: 45000,
    icon: Landmark,
  },
  {
    name: "Digital Wallet",
    type: "E-Wallet",
    balance: 27500,
    icon: CreditCard,
  },
];

export default function AccountsPage() {
  return (
    <div>
      <PageHeading
        title="Accounts"
        description="Manage where you keep your money"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => {
          const Icon = account.icon;

          return (
            <Card
              key={account.name}
              className="rounded-2xl shadow-sm"
            >
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <Icon size={20} />
                  </div>

                  <span className="text-xs text-slate-500">
                    {account.type}
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  {account.name}
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {formatMoney(account.balance)}
                </h2>

                <p className="mt-3 text-xs text-slate-400">
                  Example balance
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
