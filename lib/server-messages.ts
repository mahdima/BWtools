import "server-only";
import type { z } from "zod";
import { getTranslations } from "next-intl/server";
import type { ActionResult } from "@/lib/action-result";
import { parseForm, type ParseResult } from "@/lib/validation/form";
import type { BulkWords } from "@/lib/bulk";

// Server-action messages in the admin's language (P7-04d).

// A message as lib code reports it: a key in "validation" plus its values.
export type MessageRef = { key: string; values?: Record<string, string | number> };

// Translates "validation" keys (from zod schemas or lib/product-import.ts). Unknown keys,
// such as zod's own defaults, are returned as they are.
export async function getValidationText() {
  const t = await getTranslations("validation");
  return (ref: MessageRef | string): string => {
    const { key, values } = typeof ref === "string" ? { key: ref, values: undefined } : ref;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the key comes from lib code
    return t.has(key as any) ? t(key as any, values as any) : key;
  };
}

// parseForm, with the first problem translated for the admin.
export async function parseFormT<S extends z.ZodType>(
  schema: S,
  input: FormData | Record<string, unknown>,
): Promise<ParseResult<z.output<S>>> {
  const parsed = parseForm(schema, input);
  if (parsed.success) return parsed;
  return { success: false, message: (await getValidationText())(parsed.message) };
}

// What actions return when the caller lacks the role.
export async function notAuthorized(): Promise<ActionResult> {
  const t = await getTranslations("actions.common");
  return { success: false, message: t("notAuthorized") };
}

// The words bulkResult (lib/bulk.ts) needs.
export async function getBulkWords(): Promise<BulkWords> {
  const t = await getTranslations("actions.common");
  return {
    nothingToDo: t("nothingToDo"),
    failed: (count, first) => (count === 1 ? t("failedOne", { first }) : t("failedMany", { count, first })),
  };
}

// The result for a failed image upload (uploadImage throws with the storage error).
export async function uploadFailed(error: unknown): Promise<ActionResult> {
  const t = await getTranslations("actions.common");
  return { success: false, message: t("uploadFailed", { error: error instanceof Error ? error.message : String(error) }) };
}
