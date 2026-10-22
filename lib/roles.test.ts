import { describe, expect, it } from "vitest";
import { ROLES, hasRole, isRole } from "@/lib/roles";

describe("isRole", () => {
  it.each(ROLES)("accepts %s", (role) => {
    expect(isRole(role)).toBe(true);
  });

  it.each(["editor", "ADMIN", "Super_Admin", "", " admin"])("rejects %j", (value) => {
    expect(isRole(value)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isRole(null)).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(1)).toBe(false);
    expect(isRole({ role: "admin" })).toBe(false);
  });
});

describe("hasRole", () => {
  it("lets every role satisfy its own level", () => {
    for (const role of ROLES) expect(hasRole(role, role)).toBe(true);
  });

  it("ranks super_admin > admin > viewer", () => {
    expect(hasRole("super_admin", "admin")).toBe(true);
    expect(hasRole("super_admin", "viewer")).toBe(true);
    expect(hasRole("admin", "viewer")).toBe(true);

    expect(hasRole("admin", "super_admin")).toBe(false);
    expect(hasRole("viewer", "admin")).toBe(false);
    expect(hasRole("viewer", "super_admin")).toBe(false);
  });

  it("never passes unknown or missing roles", () => {
    expect(hasRole("editor", "viewer")).toBe(false);
    expect(hasRole(null, "viewer")).toBe(false);
    expect(hasRole(undefined, "viewer")).toBe(false);
    expect(hasRole("", "viewer")).toBe(false);
  });
});
