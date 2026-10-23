import { requireAdminPage } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getTranslations } from "next-intl/server";

// Reached from the password reset email via /auth/confirm, which signs the admin in.
// Behind the admin check, so the link only works for active admins.
export default async function ResetPasswordPage() {
  const admin = await requireAdminPage();
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-card p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("resetTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("resetFor", { email: admin.email ?? "" })}</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
