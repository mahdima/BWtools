import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/redirect";

describe("safeRedirectPath", () => {
  it.each(["/", "/reset-password", "/order/12?tab=notes"])("keeps the same-site path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    null,
    undefined,
    "",
    "reset-password",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
  ])("falls back for %j", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
    expect(safeRedirectPath(value, "/login")).toBe("/login");
  });
});
