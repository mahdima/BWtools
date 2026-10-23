import { describe, expect, it } from "vitest";
import { MAX_BULK, bulkResult, parseBulkIds, type BulkWords } from "@/lib/bulk";

// The English words, as getBulkWords builds them from messages/en.json
const words: BulkWords = {
  nothingToDo: "Nothing to do",
  failed: (count, first) => (count === 1 ? `1 failed: ${first}` : `${count} failed, e.g. ${first}`),
};

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

describe("bulkResult", () => {
  it("reports what was done", () => {
    expect(bulkResult(["Deleted 2 products", "Archived 1 product"], [], words)).toEqual({
      success: true,
      message: "Deleted 2 products. Archived 1 product.",
    });
    expect(bulkResult([], [], words)).toEqual({ success: true, message: "Nothing to do." });
  });

  it("fails when anything failed, naming the first failure", () => {
    expect(bulkResult(["Restored 2 products"], ["#9: Product not found."], words)).toEqual({
      success: false,
      message: "Restored 2 products. 1 failed: #9: Product not found.",
    });
    expect(bulkResult([], ["#1: x", "#2: y"], words)).toEqual({ success: false, message: "2 failed, e.g. #1: x" });
  });
});
