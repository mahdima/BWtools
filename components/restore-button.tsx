"use client";

import { useTransition } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { useRunWithToast } from "@/lib/use-toast-action";
import { useTranslations } from "next-intl";

// Restores an archived row (P6-08). Not destructive, so there's no confirmation.
export function RestoreButton({ name, action }: { name: string; action: () => Promise<ActionResult> }) {
  const t = useTranslations("archive");
  const runToast = useRunWithToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={t("restoreName", { name })}
      onClick={() => startTransition(() => runToast(action).then(() => undefined))}
      className="h-7 gap-1 text-gray-600 hover:text-primary hover:bg-primary/5"
    >
      <ArchiveRestore className="h-4 w-4" />
      {pending ? t("restoring") : t("restore")}
    </Button>
  );
}
