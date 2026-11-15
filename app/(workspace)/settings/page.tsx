
import {
  Banknote,
  CalendarDays,
  Languages,
  SunMoon,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  PageHeading,
} from "@/components/layout/page-heading";

import {
  CategoryManager,
} from "@/components/categories/category-manager";

import {
  DataSafety,
} from "@/components/settings/data-safety";

import {
  SettingsOverview,
} from "@/components/settings/settings-overview";

import {
  CompleteBackupExport,
} from "@/components/settings/complete-backup-export";

import {
  CompleteBackupRestore,
} from "@/components/settings/complete-backup-restore";

interface Preference {
  title: string;
  value: string;
  icon: LucideIcon;
}

const preferences: Preference[] = [
  {
    title: "Currency",
    value: "Nepalese Rupee (NPR)",
    icon: Banknote,
  },
  {
    title: "Language",
    value: "English",
    icon: Languages,
  },
  {
    title: "Date Format",
    value: "DD MMM YYYY",
    icon: CalendarDays,
  },
  {
    title: "Appearance",
    value: "Light / Dark Mode",
    icon: SunMoon,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-6 sm:space-y-10">
      <PageHeading
        title="Settings"
        description="Manage your application preferences"
      />

      {/* WORKSPACE OVERVIEW */}

      <SettingsOverview />

      {/* GENERAL PREFERENCES */}

      <section
        aria-label="General preferences"
        className="space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Personal preferences
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Your workspace defaults and
            display conventions.
          </p>
        </div>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              General Preferences
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Your current application settings
            </p>

            <div className="mt-4 divide-y divide-border">
              {preferences.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-2 last:pb-1"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <Icon
                          size={18}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </div>

                      <span className="text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                    </div>

                    <span className="text-sm text-muted-foreground sm:text-right">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CATEGORY MANAGEMENT */}

      <section
        aria-label="Category management"
        className="min-w-0"
      >
        <CategoryManager />
      </section>

      {/* EXISTING DATA SAFETY AND AUDIT */}

      <section
        aria-label="Data safety tools"
        className="min-w-0"
      >
        <DataSafety />
      </section>

      {/* COMPLETE BACKUP EXPORT */}

      <CompleteBackupExport />

      {/* COMPLETE BACKUP RESTORE */}

      <CompleteBackupRestore />
    </div>
  );
}
