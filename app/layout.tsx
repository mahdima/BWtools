import type { Metadata } from "next";
import { Noto_Sans_Arabic, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { localeDirection } from "@/lib/i18n";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ToastListener } from "@/components/toast-listener";
import { Suspense } from "react";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
// Arabic letters (Outfit has none); see --font-sans in globals.css
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: {
    default: "BW Tools Dashboard",
    template: "%s | BW Tools",
  },
  description:
    "Professional admin dashboard for managing your e-commerce store - products, orders, customers, and team.",
  keywords: [
    "admin",
    "dashboard",
    "e-commerce",
    "BW Tools",
    "inventory management",
  ],
  authors: [{ name: "BW Tools" }],
  openGraph: {
    title: "BW Tools Dashboard",
    description:
      "Professional admin dashboard for managing your e-commerce store",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: false, // Dashboard should not be indexed
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The admin's language (i18n/request.ts); Arabic is laid out right to left
  const locale = await getLocale();

  return (
    <html lang={locale} dir={localeDirection(locale)} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${arabic.variable} font-sans antialiased selection:bg-indigo-500/30`}
      >
        <NextIntlClientProvider>
        {/* Follows the device until the admin picks light or dark (P7-05) */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            <ToastListener />
          </Suspense>
          {children}
          <Toaster />
        </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
