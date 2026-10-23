"use client"; // Error boundaries must be Client Components

import { ErrorState } from "@/components/error-state";

// Errors in pages outside the dashboard layout (login, invoice, password reset).
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="min-h-screen bg-card flex items-center justify-center">
      <ErrorState error={error} retry={retry} />
    </main>
  );
}
