import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { runWithToast } from "@/lib/toast-action";
import { NOT_AUTHORIZED, isForeignKeyViolation } from "@/lib/action-result";

describe("runWithToast", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("shows a success toast and returns true", async () => {
    await expect(runWithToast(async () => ({ success: true, message: "Brand deleted." }))).resolves.toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Brand deleted.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the action's error message and returns false", async () => {
    await expect(runWithToast(async () => NOT_AUTHORIZED)).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Not authorized");
  });

  it("turns a thrown error into a generic toast", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      runWithToast(async () => {
        throw new Error("internal details");
      }),
    ).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
    spy.mockRestore();
  });
});

describe("isForeignKeyViolation", () => {
  it("matches Postgres error 23503 only", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
    expect(isForeignKeyViolation({ code: "23505" })).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
    expect(isForeignKeyViolation(undefined)).toBe(false);
  });
});
