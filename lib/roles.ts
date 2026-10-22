// Admin roles, highest privilege first.
export const ROLES = ["super_admin", "admin", "viewer"] as const;

export type Role = (typeof ROLES)[number];

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  admin: 1,
  super_admin: 2,
};

// How each role is shown in the UI.
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  viewer: "Viewer",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// True when `role` is at least `minRole`. Unknown or missing roles never pass.
export function hasRole(role: string | null | undefined, minRole: Role): boolean {
  if (!isRole(role)) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}
