import type messages from "./messages/en.json";
import type { AppLocale } from "./lib/i18n";

// Typed translation keys (P7-04): t("nav.products") is checked against
// messages/en.json; lib/messages.test.ts keeps fr.json and ar.json in step.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
