// Interface languages (P7-04). Pure, so it can be used anywhere and unit-tested.

export const LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

// The admin's choice, set by the language picker (see app/locale/actions.ts).
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Each language named in itself, as pickers show them.
export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

// The Intl locale for dates and numbers. Algerian French and Arabic: ar-DZ keeps
// Latin digits (12.500) where plain "ar" may use Arabic-Indic ones in browsers.
export function intlLocale(locale: string): string {
  return locale === "fr" ? "fr-DZ" : locale === "ar" ? "ar-DZ" : "en-US";
}

// The best supported language in an Accept-Language header, e.g.
// "fr-DZ,fr;q=0.9,ar;q=0.8" -> "fr". Null when none is supported.
export function matchAcceptLanguage(header: string | null | undefined): AppLocale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { language: tag.split("-")[0].toLowerCase(), quality: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return ranked.map((entry) => entry.language).find(isLocale) ?? null;
}
