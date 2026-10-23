import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityForm } from "@/components/SecurityForm";
import { requireAdminPage } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { getStoreSettings } from "@/lib/data/settings";
import { StoreSettingsForm } from "@/components/store-settings-form";

const SettingsPage = async () => {
  const [admin, settings, t, roles] = await Promise.all([
    requireAdminPage(),
    getStoreSettings(),
    getTranslations("settings"),
    getTranslations("roles"),
  ]);
  const isSuperAdmin = admin.role === "super_admin";

  return (
    <div className="p-4 w-[98%] mx-auto">
      <div className="mb-6 mt-5">
        <h1 className="text-2xl font-bold mb-1 text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="security">{t("security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 max-w-2xl">
            <h3 className="text-lg font-medium mb-4">{t("yourAccount")}</h3>
            <dl className="grid gap-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <dt className="text-sm font-medium text-muted-foreground">{t("email")}</dt>
                <dd className="col-span-2 font-medium text-foreground">{admin.email}</dd>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <dt className="text-sm font-medium text-muted-foreground">{t("role")}</dt>
                <dd className="col-span-2 flex">
                  <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
                    {roles(admin.role)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 max-w-2xl">
            <h3 className="text-lg font-medium mb-1">{t("store")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("storeHelp")}</p>
            {isSuperAdmin && settings.isDefault && (
              <p className="mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                {t("defaultsNotice")}
              </p>
            )}
            {isSuperAdmin ? (
              <StoreSettingsForm settings={settings} />
            ) : (
              <dl className="grid gap-4">
                {[
                  [t("storeName"), settings.store_name],
                  [t("contactEmail"), settings.contact_email],
                  [t("contactPhone"), settings.contact_phone ?? "—"],
                  [t("address"), settings.address || "—"],
                  [t("lowStockThreshold"), String(settings.low_stock_threshold)],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-3 items-center gap-4">
                    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                    <dd className="col-span-2 font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 max-w-2xl">
            <SecurityForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

