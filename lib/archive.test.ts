import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake supabaseAdmin for setArchived / hasActiveProducts: each call resolves to `db.next`
const db = vi.hoisted(() => ({
  next: { data: null, count: null, error: null } as {
    data: unknown[] | null;
    count: number | null;
    error: { code?: string; message: string } | null;
  },
  calls: [] as string[][],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAdmin", () => {
  // Every builder method records itself and returns the builder; awaiting it gives db.next
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "update", "select", "eq", "limit"]) {
    builder[method] = (...args: unknown[]) => {
      db.calls.push([method, ...args.map((arg) => JSON.stringify(arg))]);
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown) => resolve(db.next);
  return { supabaseAdmin: builder };
});

import { archiveResult, hasActiveProducts, isMissingColumn, queryByArchived, setArchived } from "@/lib/archive";

const missingFilterColumn = { code: "42703", message: "column products.is_archived does not exist" };

beforeEach(() => {
  db.next = { data: null, count: null, error: null };
  db.calls = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("isMissingColumn", () => {
  it("recognises a missing column in a filter or an update", () => {
    expect(isMissingColumn(missingFilterColumn)).toBe(true);
    expect(isMissingColumn({ code: "PGRST204" })).toBe(true);
    expect(isMissingColumn({ code: "23503" })).toBe(false);
    expect(isMissingColumn(null)).toBe(false);
  });
});

describe("queryByArchived", () => {
  it("filters once when the column exists", async () => {
    const run = vi.fn(async (archived: boolean | null) => ({ data: [archived], error: null }));
    await expect(queryByArchived(false, run)).resolves.toEqual({ result: { data: [false], error: null }, archiving: true });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("reruns active lists unfiltered until the column exists", async () => {
    const run = vi.fn(async (archived: boolean | null) =>
      archived === null ? { data: ["all rows"], error: null } : { data: null, error: missingFilterColumn },
    );
    await expect(queryByArchived(false, run)).resolves.toEqual({
      result: { data: ["all rows"], error: null },
      archiving: false,
    });
    expect(run.mock.calls).toEqual([[false], [null]]);
  });

  it("returns no archived list until the column exists", async () => {
    const run = vi.fn(async () => ({ data: null, error: missingFilterColumn }));
    await expect(queryByArchived(true, run)).resolves.toEqual({ result: null, archiving: false });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("passes other errors through", async () => {
    const error = { code: "57014", message: "timeout" };
    const run = vi.fn(async () => ({ data: null, error }));
    await expect(queryByArchived(false, run)).resolves.toEqual({ result: { data: null, error }, archiving: true });
  });
});

describe("setArchived", () => {
  it("updates the row by its id column", async () => {
    db.next = { data: [{ categorie_id: 4 }], count: null, error: null };
    await expect(setArchived("categories", 4, true)).resolves.toEqual({ status: "done" });
    expect(db.calls).toEqual([
      ["from", '"categories"'],
      ["update", '{"is_archived":true}'],
      ["eq", '"categorie_id"', "4"],
      ["select", '"categorie_id"'],
    ]);
  });

  it("reports a missing row, a missing column and other errors", async () => {
    db.next = { data: [], count: null, error: null };
    await expect(setArchived("products", 1, false)).resolves.toEqual({ status: "not_found" });

    db.next = { data: null, count: null, error: { code: "PGRST204", message: "no column" } };
    await expect(setArchived("products", 1, true)).resolves.toEqual({ status: "unavailable" });

    db.next = { data: null, count: null, error: { code: "42501", message: "permission denied" } };
    await expect(setArchived("brands", 1, true)).resolves.toEqual({ status: "failed", message: "permission denied" });
  });
});

describe("archiveResult", () => {
  const messages = { done: "Archived.", notFound: "Not found.", unavailable: "Can't delete.", failed: "Failed" };

  it("maps each outcome to its message", () => {
    expect(archiveResult({ status: "done" }, messages)).toEqual({ success: true, message: "Archived." });
    expect(archiveResult({ status: "not_found" }, messages)).toEqual({ success: false, message: "Not found." });
    expect(archiveResult({ status: "unavailable" }, messages)).toEqual({ success: false, message: "Can't delete." });
    expect(archiveResult({ status: "failed", message: "boom" }, messages)).toEqual({
      success: false,
      message: "Failed: boom",
    });
  });
});

describe("hasActiveProducts", () => {
  it("counts the category's or brand's active products", async () => {
    db.next = { data: [], count: 0, error: null };
    await expect(hasActiveProducts("Category_id", 3)).resolves.toBe(false);
    expect(db.calls).toContainEqual(["eq", '"Category_id"', "3"]);
    expect(db.calls).toContainEqual(["eq", '"is_archived"', "false"]);

    db.next = { data: [{}], count: 2, error: null };
    await expect(hasActiveProducts("brand_id", 3)).resolves.toBe(true);
  });

  it("can't tell without the column, or on an error", async () => {
    db.next = { data: null, count: null, error: missingFilterColumn };
    await expect(hasActiveProducts("brand_id", 3)).resolves.toBeNull();
    expect(console.error).not.toHaveBeenCalled();

    db.next = { data: null, count: null, error: { code: "57014", message: "timeout" } };
    await expect(hasActiveProducts("brand_id", 3)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
