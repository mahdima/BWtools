"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";

const THEMES = ["light", "dark", "system"] as const;

// Light, dark, or follow the device (P7-05). next-themes stores the choice locally.
export function ThemePicker({ className = "" }: { className?: string }) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";
  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Monitor;

  return (
    <label className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{t("label")}</span>
      <select
        value={current}
        onChange={(event) => setTheme(event.target.value)}
        // The saved theme is only known in the browser
        suppressHydrationWarning
        className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground/80"
      >
        {THEMES.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
