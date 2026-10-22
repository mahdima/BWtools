import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("errors");
  return { title: t("notFoundTitle") };
}

// Unknown URLs and notFound() calls (e.g. an order or invoice that doesn't exist).
export default async function NotFound() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center gap-4 p-10">
      <div className="rounded-full bg-blue-50 p-4">
        <SearchX className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-2xl font-bold text-gray-900">{t("notFoundTitle")}</h1>
        <p className="text-sm text-gray-500 max-w-md">
          {t("notFoundText")}
        </p>
      </div>
      <Button asChild className="bg-primary text-white hover:bg-primary-strong">
        <Link href="/">{tc("goToDashboard")}</Link>
      </Button>
    </main>
  );
}
