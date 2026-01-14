"use client";

import { useTransition } from "react";
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

interface TeamMember {
  id: string;
  email: string;
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
  const [isPending, startTransition] = useTransition();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-5 w-5 text-purple-600" />;
      case "admin":
        return <UserCog className="h-5 w-5 text-blue-600" />;
      default:
        return <Eye className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      await updateAdminRole(member.id, newRole);
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      if (member.is_active) {
        await deactivateAdmin(member.id);
      } else {
        await reactivateAdmin(member.id);
      }
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 ${
        !member.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getRoleIcon(member.role)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {member.full_name || "No name"}
            </p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isPending}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleRoleChange("super_admin")}
                disabled={member.role === "super_admin"}
              >
                <Shield className="h-4 w-4 mr-2 text-purple-600" />
                Super Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleChange("admin")}
                disabled={member.role === "admin"}
              >
                <UserCog className="h-4 w-4 mr-2 text-blue-600" />
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRoleChange("viewer")}
                disabled={member.role === "viewer"}
              >
                <Eye className="h-4 w-4 mr-2 text-gray-600" />
                Viewer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleActive}>
                {member.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2 text-red-600" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                    Reactivate
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
          {member.role.replace("_", " ").toUpperCase()}
        </span>
        {!member.is_active && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            INACTIVE
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Joined {new Date(member.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
