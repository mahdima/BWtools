import { describe, expect, it } from "vitest";
import { MAX_BULK, bulkResult, countLabel, parseBulkIds } from "@/lib/bulk";

describe("parseBulkIds", () => {
  it("accepts numbers and numeric strings, without repeats", () => {
    expect(parseBulkIds(["3", 5, "3"])).toEqual([3, 5]);
  });

  it("rejects empty, oversized and malformed lists", () => {
    expect(parseBulkIds([])).toBeNull();
    expect(parseBulkIds(Array.from({ length: MAX_BULK + 1 }, (_, i) => i + 1))).toBeNull();
    expect(parseBulkIds(["1", "2; drop table"])).toBeNull();
    expect(parseBulkIds([0])).toBeNull();
    expect(parseBulkIds([1.5])).toBeNull();
    expect(parseBulkIds("1,2")).toBeNull();
  });
});

describe("countLabel", () => {
  it("pluralises", () => {
    expect(countLabel(1, "order")).toBe("1 order");
    expect(countLabel(4, "order")).toBe("4 orders");
  });
});

describe("bulkResult", () => {
  it("reports what was done", () => {
    expect(bulkResult(["Deleted 2 products", "archived 1 product"], [])).toEqual({
      success: true,
      message: "Deleted 2 products and archived 1 product.",
    });
  });

  it("fails when anything failed, naming the first failure", () => {
    expect(bulkResult(["Restored 2 products"], ["#9: Product not found."])).toEqual({
      success: false,
      message: "Restored 2 products. 1 failed: #9: Product not found.",
    });
    expect(bulkResult([], ["#1: x", "#2: y"])).toEqual({ success: false, message: "2 failed, e.g. #1: x" });
  });
});
