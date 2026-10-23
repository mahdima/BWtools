"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateAdminProfile } from "@/app/(dashboard)/profile/update-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormAction } from "@/lib/use-form-action";
import { useTranslations } from "next-intl";

interface ProfileEditDialogProps {
  admin: {
    full_name: string | null;
    email: string | undefined;
  };
  className?: string;
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm";

export function ProfileEditDialog({ admin, className }: ProfileEditDialogProps) {
  const t = useTranslations("profile");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={className}>{t("editProfile")}</button>
      </DialogTrigger>
      {/* Radix mounts the content on open, so each open starts without an old error */}
      <DialogContent className="sm:max-w-md bg-card" aria-describedby={undefined}>
        <ProfileFormBody admin={admin} onDone={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProfileFormBody({
  admin,
  onDone,
}: {
  admin: ProfileEditDialogProps["admin"];
  onDone: () => void;
}) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { state, isPending, onSubmit } = useFormAction(async (prev, formData) => {
    const result = await updateAdminProfile(prev, formData);
    if (result.success) {
      onDone();
      toast.success(result.message);
    }
    return result;
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("editProfile")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        {state && !state.success && (
          <div role="alert" className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
            {state.message}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="profile-full-name" className="text-sm font-medium text-foreground/80">
            {t("fullName")}
          </label>
          <input
            id="profile-full-name"
            name="fullName"
            defaultValue={admin.full_name || ""}
            required
            className={inputClass}
            placeholder={t("fullNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-email" className="text-sm font-medium text-foreground/80">
            {t("email")}
          </label>
          <input
            id="profile-email"
            name="email"
            type="email"
            defaultValue={admin.email || ""}
            className={inputClass}
            placeholder="admin@example.com"
            aria-describedby="profile-email-help"
          />
          <p id="profile-email-help" className="text-xs text-muted-foreground/70">
            {t("emailHelp")}
          </p>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-strong disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("saveChanges")}
          </button>
        </div>
      </form>
    </>
  );
}
