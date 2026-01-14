import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ToastListener } from "@/components/toast-listener";
import { Suspense } from "react";

const outfit = Outfit({ subsets: ["latin"] });

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.className} antialiased selection:bg-indigo-500/30`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <ToastListener />
          </Suspense>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
