"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ToastListener() {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        if (toastType === "success") {
          toast.success(t("done"));
        } else if (toastType === "error") {
          toast.error(t("failed"));
        }
      }, 0);

      // Clean up URL without reload if possible, but replace works
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router, t]);

  return null;
}
