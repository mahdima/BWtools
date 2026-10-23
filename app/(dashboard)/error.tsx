"use client"; // Error boundaries must be Client Components

import { ErrorState } from "@/components/error-state";

// Errors in a dashboard page: shown inside the layout, so the sidebar stays usable.
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
