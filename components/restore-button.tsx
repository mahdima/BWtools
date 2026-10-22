"use client";

import { useTransition } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { runWithToast } from "@/lib/toast-action";

// Restores an archived row (P6-08). Not destructive, so there's no confirmation.
export function RestoreButton({ name, action }: { name: string; action: () => Promise<ActionResult> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Restore ${name}`}
      onClick={() => startTransition(() => runWithToast(action).then(() => undefined))}
      className="h-7 gap-1 text-gray-600 hover:text-primary hover:bg-primary/5"
    >
      <ArchiveRestore className="h-4 w-4" />
      {pending ? "Restoring..." : "Restore"}
    </Button>
  );
}
