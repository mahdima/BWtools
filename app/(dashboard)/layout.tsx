import Sidebar from "@/components/Sidebar";
import { requireAdminPage } from "@/lib/auth";
import { getNotifications } from "./notifications/actions";
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdminPage();
  const notifications = await getNotifications();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <MobileSidebarWrapper>
          <Sidebar
            userEmail={admin.email}
            userName={admin.full_name ?? undefined}
            notifications={notifications}
          />
        </MobileSidebarWrapper>
        <main className="flex-1 w-0 bg-accent overflow-hidden flex flex-col lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
