import { requireAdminPage } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/reset-password-form";

// Reached from the password reset email via /auth/confirm, which signs the admin in.
// Behind the admin check, so the link only works for active admins.
export default async function ResetPasswordPage() {
  const admin = await requireAdminPage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-600">For {admin.email}</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
