import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

// Unknown URLs and notFound() calls (e.g. an order or invoice that doesn't exist).
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center gap-4 p-10">
      <div className="rounded-full bg-blue-50 p-4">
        <SearchX className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-500 max-w-md">
          The page or record you&apos;re looking for doesn&apos;t exist, or it was deleted.
        </p>
      </div>
      <Button asChild className="bg-primary text-white hover:bg-primary-strong">
        <Link href="/">Go to dashboard</Link>
      </Button>
    </main>
  );
}
