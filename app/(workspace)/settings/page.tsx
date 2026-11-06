
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";

const preferences = [
  {
    title: "Currency",
    value: "Nepalese Rupee (NPR)",
  },
  {
    title: "Language",
    value: "English",
  },
  {
    title: "Date Format",
    value: "DD MMM YYYY",
  },
  {
    title: "Appearance",
    value: "Light / Dark Mode",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeading
        title="Settings"
        description="Manage your application preferences"
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h2 className="mb-6 text-lg font-semibold">
            General Preferences
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {preferences.map((item) => (
              <div
                key={item.title}
                className="flex flex-wrap items-center justify-between gap-3 py-5"
              >
                <p className="text-sm font-medium">
                  {item.title}
                </p>

                <span className="text-sm text-slate-500">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Preferences are currently for display only.
            Editable settings will be added later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
