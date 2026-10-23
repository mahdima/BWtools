"use client";

import { useState, useTransition } from "react";
import {
  Shield,
  UserCog,
  Eye,
  MoreVertical,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateAdminRole,
  deactivateAdmin,
  reactivateAdmin,
} from "@/app/(dashboard)/team/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRunWithToast } from "@/lib/use-toast-action";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/lib/i18n";
import { isRole } from "@/lib/roles";

interface TeamMember {
  id: string;
  email?: string; // from the auth user (`admins` has no email column)
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  canManage: boolean;
}

export function TeamMemberCard({ member, canManage }: TeamMemberCardProps) {
  const t = useTranslations("team");
  const runToast = useRunWithToast();
  const roles = useTranslations("roles");
  const locale = useLocale();
  const name = member.full_name || member.email || t("thisAdmin");
  const [isPending, startTransition] = useTransition();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case "admin":
        return <UserCog className="h-5 w-5 text-primary" />;
      default:
        return <Eye className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "admin":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-muted text-foreground/80 border-border";
    }
  };

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      await runToast(() => updateAdminRole(member.id, newRole));
    });
  };

  const handleToggleActive = () => {
    if (member.is_active) {
      // Deactivating also blocks their sign-in, so ask first
      setConfirmDeactivate(true);
    } else {
      startTransition(async () => {
        await runToast(() => reactivateAdmin(member.id));
      });
    }
  };

  return (
    <div
      className={`bg-card rounded-xl border shadow-sm p-4 ${
        !member.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {getRoleIcon(member.role)}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {member.full_name || t("noName")}
            </p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>

        {canManage && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t("actionsFor", { name })}
                disabled={isPending}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("changeRole")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleRoleChange("super_admin")}
                disabled={member.role === "super_admin"}
              >
                <Shield className="h-4 w-4 me-2 text-purple-600 dark:text-purple-400" />
                {roles("super_admin")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleChange("admin")}
                disabled={member.role === "admin"}
              >
                <UserCog className="h-4 w-4 me-2 text-primary" />
                {roles("admin")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleChange("viewer")}
                disabled={member.role === "viewer"}
              >
                <Eye className="h-4 w-4 me-2 text-muted-foreground" />
                {roles("viewer")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleActive}>
                {member.is_active ? (
                  <>
                    <UserX className="h-4 w-4 me-2 text-red-600 dark:text-red-400" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 me-2 text-green-600 dark:text-green-400" />
                    {t("reactivate")}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
            member.role
          )}`}
        >
          {isRole(member.role) ? roles(member.role) : member.role}
        </span>
        {!member.is_active && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20">
            {t("inactive")}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title={t("deactivateTitle", { name })}
        description={t("deactivateText")}
        confirmLabel={t("deactivate")}
        destructive
        action={() => deactivateAdmin(member.id)}
      />

      <p className="text-xs text-muted-foreground/70 mt-3">
        {t("joined", { date: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(member.created_at)) })}
      </p>
    </div>
  );
}
