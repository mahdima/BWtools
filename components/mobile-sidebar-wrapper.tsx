"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface MobileSidebarWrapperProps {
  children: React.ReactNode;
}

export function MobileSidebarWrapper({ children }: MobileSidebarWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close sidebar on route change (adjusting state during render, not in an effect)
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 start-4 z-50 lg:hidden bg-white/80 backdrop-blur-sm shadow-sm border"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed lg:static inset-y-0 start-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full rtl:max-lg:translate-x-full lg:translate-x-0"}
        `}
      >
        {children}
      </div>
    </>
  );
}
