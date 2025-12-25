import { getAdminProfile } from "./actions";
import { User, Mail, Shield, Calendar } from "lucide-react";
import Image from "next/image";
import man from "../../../img/man.png";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";

export default async function ProfilePage() {
  const admin = await getAdminProfile();

  if (!admin) {
    return <div>Please log in.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>

        <div className="px-8 pb-8">
          {/* Avatar & Header Info */}
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
                <Image
                  src={man} // Default avatar as schema doesn't have avatar_url
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mb-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {admin.full_name || "Admin User"}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 font-medium capitalize">
                    {admin.role}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      admin.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {admin.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <ProfileEditDialog
              admin={{
                id: admin.id,
                full_name: admin.full_name,
                role: admin.role,
                email: admin.email,
              }}
              className="mb-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-all"
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email Address
                </p>
                <p className="font-semibold text-gray-900 mt-1">
                  {admin.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Role
                </p>
                <p className="font-semibold text-gray-900 mt-1 capitalize">
                  {admin.role}
                </p>
              </div>
            </div>

            {/* User ID removed for security reasons */}

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Joined
                </p>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
