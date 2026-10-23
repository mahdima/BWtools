import { requireAdminPage } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { intlLocale } from "@/lib/i18n";
import { STORE_TIME_ZONE } from "@/lib/dates";
import { User, Mail, Shield, Calendar } from "lucide-react";
import Image from "next/image";
import man from "../../../img/man.png";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";

export default async function ProfilePage() {
  const [admin, t, roles, locale] = await Promise.all([
    requireAdminPage(),
    getTranslations("profile"),
    getTranslations("roles"),
    getLocale(),
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>

        <div className="px-8 pb-8">
          {/* Avatar & Header Info */}
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-muted overflow-hidden shadow-sm">
                <Image
                  src={man} // Default avatar as schema doesn't have avatar_url
                  alt={admin.full_name || t("adminUser")}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mb-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {admin.full_name || t("adminUser")}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground font-medium">
                    {roles(admin.role)}
                  </p>
                  {/* Only active admins can reach this page */}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    {t("active")}
                  </span>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <ProfileEditDialog
              admin={{
                full_name: admin.full_name,
                email: admin.email,
              }}
              className="mb-2 px-4 py-2 bg-card border border-border text-foreground/80 rounded-lg text-sm font-medium shadow-sm hover:bg-muted/60 transition-all"
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-start gap-4">
              <div className="p-2 bg-card rounded-lg shadow-sm text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("emailAddress")}
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {admin.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-start gap-4">
              <div className="p-2 bg-card rounded-lg shadow-sm text-purple-600 dark:text-purple-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("role")}
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {roles(admin.role)}
                </p>
              </div>
            </div>

            {/* User ID removed for security reasons */}

            <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-start gap-4">
              <div className="p-2 bg-card rounded-lg shadow-sm text-orange-600 dark:text-orange-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("joined")}
                </p>
                <p className="font-semibold text-foreground mt-1">
                  {admin.created_at
                    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: STORE_TIME_ZONE }).format(
                        new Date(admin.created_at),
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

