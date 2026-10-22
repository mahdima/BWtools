import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  insert: vi.fn<(row: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }>>(
    async () => ({ error: null }),
  ),
  // Callbacks passed to after(), run by the test as if the response had been sent
  pending: [] as (() => Promise<void>)[],
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (callback: () => Promise<void>) => db.pending.push(callback) }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: (table: string) => (table === "audit_log" ? { insert: db.insert } : null) },
}));

import { logAudit } from "@/lib/audit";

async function flush() {
  for (const callback of db.pending.splice(0)) await callback();
}

beforeEach(() => {
  db.insert.mockClear();
  db.pending = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("logAudit", () => {
  it("writes the entry only after the response", async () => {
    logAudit("admin-1", "update", "product", 12, { unite_price: { from: 1200, to: 1500 } });
    expect(db.insert).not.toHaveBeenCalled();

    await flush();
    expect(db.insert).toHaveBeenCalledWith({
      admin_id: "admin-1",
      action: "update",
      entity: "product",
      entity_id: "12",
      changes: { unite_price: { from: 1200, to: 1500 } },
    });
  });

  it("stores no changes as null", async () => {
    logAudit("admin-1", "restore", "brand", 3, {});
    logAudit("admin-1", "export", "order", null);
    await flush();
    expect(db.insert.mock.calls.map(([row]) => [row.entity_id, row.changes])).toEqual([
      ["3", null],
      [null, null],
    ]);
  });

  it("stays quiet while the table doesn't exist, and logs other failures", async () => {
    db.insert.mockResolvedValueOnce({ error: { code: "PGRST205", message: "no table" } });
    logAudit("admin-1", "delete", "category", 4);
    await flush();
    expect(console.error).not.toHaveBeenCalled();

    db.insert.mockResolvedValueOnce({ error: { code: "42501", message: "permission denied" } });
    logAudit("admin-1", "delete", "category", 4);
    await flush();
    expect(console.error).toHaveBeenCalled();
  });
});
