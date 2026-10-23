import { Clock, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18n";
import { isOrderStatus } from "@/lib/orders";

interface TimelineEvent {
  id: number;
  old_status: string | null;
  new_status: string;
  created_at: string | null;
  admins: { full_name: string | null } | null;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  const t = useTranslations("orders.timeline");
  const statuses = useTranslations("orderStatus");
  const locale = useLocale();
  const statusLabel = (status: string) => (isOrderStatus(status) ? statuses(status) : status);
  const statusColors: Record<string, string> = {
    New: "text-green-600 dark:text-green-400 bg-green-500/10",
    processing: "text-primary bg-blue-500/10",
    Delivering: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
    Delivered: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
    Cancelled: "text-red-600 dark:text-red-400 bg-red-500/10",
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/40">
        <h2 className="font-semibold text-foreground flex items-center">
          <Clock className="h-5 w-5 me-2 text-primary" />
          {t("title")}
        </h2>
      </div>
      <div className="p-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("none")}
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 relative">
                {/* Timeline Line */}
                {index < events.length - 1 && (
                  <div className="absolute start-[11px] top-6 w-0.5 h-full bg-accent" />
                )}

                {/* Timeline Dot */}
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-card" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.old_status && (
                      <>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            statusColors[event.old_status] ||
                            "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {statusLabel(event.old_status)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/70 rtl:rotate-180" />
                      </>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[event.new_status] ||
                        "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {statusLabel(event.new_status)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{event.admins?.full_name || t("system")}</span>
                    <span>•</span>
                    <span>{event.created_at && formatDate(event.created_at, locale, true)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
