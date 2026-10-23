"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/(dashboard)/settings/actions";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function SecurityForm() {
  const t = useTranslations("settings");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await updatePassword(formData);

    setLoading(false);
    setMessage({
      success: result.success,
      text: result.message,
    });

    if (result.success) {
      // Optional: Clear form
      (document.getElementById("security-form") as HTMLFormElement)?.reset();
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">{t("passwordTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("passwordHelp")}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.success
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        id="security-form"
        action={handleSubmit}
        className="space-y-4 max-w-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
          />
        </div>
        <Button
          disabled={loading}
          type="submit"
          className="bg-primary hover:bg-primary-strong text-white"
        >
          {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("updatePassword")}
        </Button>
      </form>
    </div>
  );
}
