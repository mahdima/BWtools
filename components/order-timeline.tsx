import { Clock, ArrowRight } from "lucide-react";

interface TimelineEvent {
  id: number;
  old_status: string | null;
  new_status: string;
  created_at: string;
  admins: { full_name: string } | null;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  const statusColors: Record<string, string> = {
    New: "text-green-600 bg-green-50",
    processing: "text-blue-600 bg-blue-50",
    Delivering: "text-yellow-600 bg-yellow-50",
    Delivered: "text-orange-600 bg-orange-50",
    Cancelled: "text-red-600 bg-red-50",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-[#0B1DFF]" />
          Status History
        </h2>
      </div>
      <div className="p-6">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No status changes recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 relative">
                {/* Timeline Line */}
                {index < events.length - 1 && (
                  <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200" />
                )}

                {/* Timeline Dot */}
                <div className="w-6 h-6 rounded-full bg-[#0B1DFF] flex items-center justify-center flex-shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.old_status && (
                      <>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            statusColors[event.old_status] ||
                            "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {event.old_status}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[event.new_status] ||
                        "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {event.new_status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    <span>{event.admins?.full_name || "System"}</span>
                    <span>•</span>
                    <span>{new Date(event.created_at).toLocaleString()}</span>
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
