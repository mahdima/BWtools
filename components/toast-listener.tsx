"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function ToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        if (toastType === "success") {
          toast.success("Operation completed successfully");
        } else if (toastType === "error") {
          toast.error("Something went wrong");
        }
      }, 0);

      // Clean up URL without reload if possible, but replace works
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}
