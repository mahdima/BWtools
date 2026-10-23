"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  Check,
  Package,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/app/(dashboard)/notifications/actions";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/lib/i18n";
import { STORE_TIME_ZONE } from "@/lib/dates";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface NotificationsPanelProps {
  notifications: Notification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return <Package className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const handleMarkAsRead = (id: number) => {
    startTransition(async () => {
      await markNotificationAsRead(id);
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? t("unread", { count: unreadCount }) : t("title")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>{t("title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary-strong"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              {t("markAllRead")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("none")}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.is_read ? "bg-blue-500/5" : ""
                }`}
                onClick={() =>
                  !notification.is_read && handleMarkAsRead(notification.id)
                }
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      !notification.is_read ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {notification.created_at &&
                      new Intl.DateTimeFormat(intlLocale(locale), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: STORE_TIME_ZONE,
                      }).format(new Date(notification.created_at))}
                  </p>
                </div>
                {notification.link && (
                  <Link href={notification.link} className="flex-shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground/70 hover:text-primary" />
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
