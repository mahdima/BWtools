import React from "react";
import { requireAdminPage } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewAdminForm } from "@/components/new-admin-form";
import { getTranslations } from "next-intl/server";

export default async function NewAdminPage() {
  const [admin, t] = await Promise.all([requireAdminPage(), getTranslations("team")]);

  // Only super admins create accounts (createAdmin checks this again)
  if (admin.role !== "super_admin") {
    redirect("/team");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/team"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" /> {t("backToTeam")}
      </Link>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t("newTitle")}</h1>

        <NewAdminForm />
      </div>
    </div>
  );
}

