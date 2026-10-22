import { Skeleton } from "@/components/ui/skeleton";

// Placeholders shown by the dashboard routes' loading.tsx while their data loads.
// Shapes follow the real pages; the padding matches them (room for the mobile menu button).

function Loading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={`p-4 pl-16 lg:pl-4 w-full ${className}`}>
      {children}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function PageHeader({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>
      {withAction && <Skeleton className="h-10 w-44" />}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading className="h-[calc(100vh-2rem)] flex flex-col space-y-4">
      <PageHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="flex-1 min-h-[300px] grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
        <Skeleton className="h-full rounded-xl" />
        <Skeleton className="h-full rounded-xl" />
      </div>
    </Loading>
  );
}

// Products, orders, customers, brands, categories
export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Loading className="space-y-2">
      <PageHeader />
      <div className="rounded-xl border border-border overflow-hidden">
        <Skeleton className="h-11 rounded-none" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 h-[45px] border-t border-border">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function OrderDetailSkeleton() {
  return (
    <Loading className="max-w-5xl mx-auto">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-72 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </Loading>
  );
}

// Team members
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Loading>
      <PageHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </Loading>
  );
}

// Profile, settings
export function FormPageSkeleton() {
  return (
    <Loading className="max-w-4xl mx-auto">
      <PageHeader withAction={false} />
      <Skeleton className="h-80 rounded-2xl mt-4" />
    </Loading>
  );
}
