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

// "1 product", "3 products".
export function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// The toast for a bulk action: what was done, then the first failure and how many
// others failed. Successful only when nothing failed.
export function bulkResult(done: string[], failures: string[]): { success: boolean; message: string } {
  const doneText = done.join(" and ");
  if (failures.length === 0) return { success: true, message: `${doneText || "Nothing to do"}.` };

  const failureText =
    failures.length === 1 ? `1 failed: ${failures[0]}` : `${failures.length} failed, e.g. ${failures[0]}`;
  return { success: false, message: doneText ? `${doneText}. ${failureText}` : failureText };
}
