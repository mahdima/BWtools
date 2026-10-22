"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { setLocale } from "@/app/locale/actions";

// Switches the interface language (P7-04): saves the choice in a cookie, then
// re-renders the page in the new language and direction.
export function LanguagePicker({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <Languages className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            await setLocale(next);
            router.refresh();
          });
        }}
        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 disabled:opacity-60"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value} lang={value}>
            {LOCALE_NAMES[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
