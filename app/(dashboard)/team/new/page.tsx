import React from "react";
import { isSuperAdmin } from "../actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewAdminForm } from "@/components/new-admin-form";

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

        <NewAdminForm />
      </div>
    </div>
  );
}

