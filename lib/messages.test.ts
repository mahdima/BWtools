import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl/core";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import ar from "@/messages/ar.json";
import type { AppLocale } from "@/lib/i18n";

type Tree = { [key: string]: string | Tree };

// "nav.products" -> "Products", for every message
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...all, [path]: value } : { ...all, ...flatten(value, path) };
  }, {});
}

// The {arguments} a message expects, e.g. "Page {page} of {count}" -> count, page
function argumentsOf(message: string): string[] {
  return [...new Set([...message.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)].map((match) => match[1]))].sort();
}

const english = flatten(en);
const translations = { fr: flatten(fr as Tree), ar: flatten(ar as Tree) };

describe("messages", () => {
  for (const [locale, messages] of Object.entries(translations)) {
    it(`${locale} has exactly the English keys`, () => {
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());
    });

    it(`${locale} uses the same placeholders`, () => {
      const mismatched = Object.keys(english).filter(
        (key) => key in messages && argumentsOf(messages[key]).join() !== argumentsOf(english[key]).join(),
      );
      expect(mismatched).toEqual([]);
    });
  }

  it("every message formats in its language", () => {
    const failures: string[] = [];
    for (const [locale, tree] of Object.entries({ en, fr, ar }) as [AppLocale, Tree][]) {
      const t = createTranslator({
        locale,
        messages: tree,
        onError: (error) => failures.push(`${locale}: ${error.message}`),
      });
      for (const [key, message] of Object.entries(flatten(tree))) {
        const values = Object.fromEntries(argumentsOf(message).map((name) => [name, name === "count" ? 3 : "x"]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- keys are dynamic here
        (t as any)(key, values);
      }
    }
    expect(failures).toEqual([]);
  });
});
