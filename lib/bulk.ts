// Bulk actions (P7-03): the ids they accept and how they report what happened.

export const MAX_BULK = 100;

// The ids sent by a bulk action: whole positive numbers, each once, at most MAX_BULK.
// Null when the list is empty, too long or holds anything else.
export function parseBulkIds(ids: unknown): number[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BULK) return null;
  const numbers = ids.map((id) => (typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id));
  if (!numbers.every((id) => Number.isSafeInteger(id) && (id as number) > 0)) return null;
  return [...new Set(numbers as number[])];
}

// The words bulkResult needs, in the admin's language ("actions.common" in messages).
export type BulkWords = {
  nothingToDo: string;
  failed: (count: number, first: string) => string;
};

// The toast for a bulk action: each thing done as a sentence, then the first failure and
// how many failed. Successful only when nothing failed.
export function bulkResult(done: string[], failures: string[], words: BulkWords): { success: boolean; message: string } {
  const doneText = done.map((part) => `${part}.`).join(" ");
  if (failures.length === 0) return { success: true, message: doneText || `${words.nothingToDo}.` };

  const failureText = words.failed(failures.length, failures[0]);
  return { success: false, message: doneText ? `${doneText} ${failureText}` : failureText };
}
