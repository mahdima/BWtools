"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared body of the error boundaries (app/error.tsx, app/(dashboard)/error.tsx).
// In production Next.js hides the real message; the digest matches the server log.
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center gap-4 p-10 min-h-[60vh]">
      <div className="rounded-full bg-red-50 p-4">
        <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500 max-w-md">
          The page couldn&apos;t be loaded. Try again; if it keeps happening, share the reference below.
        </p>
        {digest && <p className="text-xs text-gray-400 font-mono">Error reference: {digest}</p>}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => retry()} className="bg-primary text-white hover:bg-primary-strong">
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
