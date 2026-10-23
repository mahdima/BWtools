import React from "react";
import { requireAdminPage } from "@/lib/auth";
import { getTeamMembers } from "@/lib/data/admins";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Shield, Eye, UserCog } from "lucide-react";
import Link from "next/link";
import { TeamMemberCard } from "../../../components/team-member-card";
import { getTranslations } from "next-intl/server";

export default async function TeamPage() {
  const [admin, members, t, roles] = await Promise.all([
    requireAdminPage(),
    getTeamMembers(),
    getTranslations("team"),
    getTranslations("roles"),
  ]);
  const isSuper = admin.role === "super_admin";

  return (
    <div className="flex flex-col h-full p-4 ps-16 lg:ps-4 w-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {isSuper && (
          <Link href="/team/new">
            <Button className="bg-primary text-white hover:bg-primary-strong">
              <UserPlus className="me-2 h-4 w-4" /> {t("addAdmin")}
            </Button>
          </Link>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-muted-foreground">{roles("super_admin")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <UserCog className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{roles("admin")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{roles("viewer")}</span>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} canManage={isSuper} />
        ))}
      </div>

      {members.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("noMembers")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

