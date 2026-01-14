import React from "react";
import { getTeamMembers, isSuperAdmin, getCurrentUserRole } from "./actions";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Shield, Eye, UserCog } from "lucide-react";
import Link from "next/link";
import { TeamMemberCard } from "../../../components/team-member-card";

export default async function TeamPage() {
  const members = await getTeamMembers();
  const isSuper = await isSuperAdmin();
  const currentRole = await getCurrentUserRole();

  return (
    <div className="flex flex-col h-full p-4 pl-16 lg:pl-4 w-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500">
            Manage admin accounts and permissions
          </p>
        </div>
        {isSuper && (
          <Link href="/team/new">
            <Button className="bg-[#0b1dff] text-white hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </Link>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-gray-600">Super Admin</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <UserCog className="h-4 w-4 text-blue-600" />
          <span className="text-gray-600">Admin</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-gray-600" />
          <span className="text-gray-600">Viewer</span>
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
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members found</p>
          </div>
        </div>
      )}
    </div>
  );
}

