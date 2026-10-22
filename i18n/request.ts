import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchAcceptLanguage } from "@/lib/i18n";
import { STORE_TIME_ZONE } from "@/lib/dates";

// next-intl without locale URLs (P7-04): the language picker's cookie, else the
// browser's preferred language, else English.
export default getRequestConfig(async () => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(chosen)
    ? chosen
    : (matchAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE);

  return {
    locale,
    timeZone: STORE_TIME_ZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
