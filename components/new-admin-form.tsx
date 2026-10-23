"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAdmin } from "@/app/(dashboard)/team/actions";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

const inputClass =
  "w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none";

// The /team/new form. A client component so validation errors show inline and
// keep what was typed; on success createAdmin redirects to /team.
export function NewAdminForm() {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const roles = useTranslations("roles");
  const { state, isPending, onSubmit } = useFormAction(createAdmin);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-foreground/80 mb-1">
          {t("fullName")}
        </label>
        <input type="text" id="fullName" name="fullName" required className={inputClass} placeholder={t("fullNamePlaceholder")} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1">
          {t("email")}
        </label>
        <input type="email" id="email" name="email" required className={inputClass} placeholder="john@example.com" />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
          {t("password")}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={72}
          className={inputClass}
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-foreground/80 mb-1">
          {t("role")}
        </label>
        <select id="role" name="role" required className={inputClass}>
          <option value="admin">{roles("admin")}</option>
          <option value="viewer">{roles("viewer")}</option>
          <option value="super_admin">{roles("super_admin")}</option>
        </select>
      </div>

      {state && !state.success && (
        <div role="alert" className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
          {state.message}
        </div>
      )}

      <div className="pt-4 flex gap-3">
        <Link href="/team" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            {tc("cancel")}
          </Button>
        </Link>
        <Button type="submit" disabled={isPending} className="flex-1 bg-primary hover:bg-primary-strong">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("createAdmin")}
        </Button>
      </div>
    </form>
  );
}
