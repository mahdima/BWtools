"use client";

import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/action-result";
import { runWithToast } from "@/lib/toast-action";

// runWithToast with its fallback error in the admin's language (P7-04d).
export function useRunWithToast() {
  const t = useTranslations("common");
  return (action: () => Promise<ActionResult>) => runWithToast(action, t("unexpected"));
}
