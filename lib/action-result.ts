// What server actions return for expected outcomes, so the UI can show a toast.
export type ActionResult = { success: boolean; message: string };

export const NOT_AUTHORIZED: ActionResult = { success: false, message: "Not authorized" };

// Postgres foreign_key_violation: the row is still referenced by another table.
export function isForeignKeyViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23503";
}
