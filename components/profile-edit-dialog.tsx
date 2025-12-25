"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateAdminProfile } from "@/app/(dashboard)/profile/update-actions";

interface ProfileEditDialogProps {
  admin: {
    id: string;
    full_name: string | null;
    role: string | null;
    email: string | undefined;
  };
  className?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      type="submit"
      className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Save Changes
    </button>
  );
}

export function ProfileEditDialog({
  admin,
  className,
}: ProfileEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clientAction(formData: FormData) {
    setMessage(null);
    const result = await updateAdminProfile(null, formData);
    if (result.success) {
      setIsOpen(false);
      // Optional: Toast usually goes here
      alert(result.message);
    } else {
      setMessage(result.message);
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className={className}>
        Edit Profile
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-lg">Edit Profile</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={clientAction} className="p-6 space-y-4">
          <input type="hidden" name="id" value={admin.id} />

          {message && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              name="fullName"
              defaultValue={admin.full_name || ""}
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={admin.email || ""}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm"
              placeholder="admin@example.com"
            />
            <p className="text-xs text-muted-foreground text-gray-400">
              Changing email will require confirmation.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">
              <select
                name="role"
                defaultValue={admin.role || "viewer"}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-sm appearance-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {/* Simple arrow for select */}
              <div className="absolute right-3 top-3 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
