"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// A URL-driven dialog (e.g. /product?add=true): closing it navigates to `returnUrl`.
// The content renders its own visible heading; `title` names the dialog for screen readers.
export function Modal({
  children,
  returnUrl,
  title,
}: {
  children: React.ReactNode;
  returnUrl?: string;
  title: string;
}) {
  const router = useRouter();

  const onDismiss = () => {
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
