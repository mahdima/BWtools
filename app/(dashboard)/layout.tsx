import Sidebar from "@/components/Sidebar";
import { getAdminProfile } from "./profile/actions";
import { getNotifications } from "./notifications/actions";
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getAdminProfile();
  const notifications = await getNotifications();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <MobileSidebarWrapper>
          <Sidebar
            userEmail={profile?.email || "Guest"}
            userName={profile?.full_name}
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
