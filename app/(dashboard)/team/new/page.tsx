import React from "react";
import { isSuperAdmin } from "../actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdmin } from "../actions";

export default async function NewAdminPage() {
  const isSuper = await isSuperAdmin();

  if (!isSuper) {
    redirect("/team");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/team"
        className="inline-flex items-center text-sm text-gray-500 hover:text-[#0B1DFF] mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Team
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Admin</h1>

        <form action={createAdmin} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] outline-none"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] outline-none"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <Link href="/team" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="flex-1 bg-[#0B1DFF] hover:bg-blue-700"
            >
              Create Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

