"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/app/(dashboard)/settings/actions";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

const inputClass =
  "mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

// New password after a reset link; same rules as Settings (8-72 characters, must match).
export function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { state, isPending, onSubmit } = useFormAction(async (_prev, formData) => {
    const result = await updatePassword(formData);
    if (result.success) {
      toast.success(t("passwordUpdated"));
      router.push("/");
    }
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t("newPassword")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          {t("confirmNewPassword")}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className={inputClass}
        />
      </div>

      {state && !state.success && (
        <div role="alert" className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("updatePassword")}
      </button>
    </form>
  );
}
