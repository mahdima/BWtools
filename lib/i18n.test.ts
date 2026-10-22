import { describe, expect, it } from "vitest";
import { isLocale, localeDirection, matchAcceptLanguage } from "@/lib/i18n";

describe("matchAcceptLanguage", () => {
  it("picks the most preferred supported language", () => {
    expect(matchAcceptLanguage("fr-DZ,fr;q=0.9,ar;q=0.8,en;q=0.5")).toBe("fr");
    expect(matchAcceptLanguage("de-DE,de;q=0.9,ar-DZ;q=0.8")).toBe("ar");
    expect(matchAcceptLanguage("en;q=0.2,ar;q=0.9")).toBe("ar");
  });

  it("returns null when nothing is supported", () => {
    expect(matchAcceptLanguage("de,es;q=0.5")).toBeNull();
    expect(matchAcceptLanguage("fr;q=0")).toBeNull();
    expect(matchAcceptLanguage("")).toBeNull();
    expect(matchAcceptLanguage(null)).toBeNull();
  });
});

describe("isLocale / localeDirection", () => {
  it("knows the supported languages and their direction", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("fr")).toBe("ltr");
  });
});
