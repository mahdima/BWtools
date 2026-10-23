"use client";

import { createContext, useContext } from "react";
import { hasRole, type Role } from "@/lib/roles";

const AdminContext = createContext<{ role: Role } | null>(null);

// Gives client components the signed-in admin's role (set by the dashboard layout).
export function AdminProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <AdminContext.Provider value={{ role }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}

// Renders `children` only for admins with at least `minRole` (otherwise `fallback`).
// This only hides controls; server actions check the role again.
export function Can({
  minRole,
  children,
  fallback = null,
}: {
  minRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const admin = useAdmin();
  return <>{admin && hasRole(admin.role, minRole) ? children : fallback}</>;
}
