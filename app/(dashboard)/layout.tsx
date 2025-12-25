import Sidebar from "@/components/Sidebar";
import { getAdminProfile } from "./profile/actions";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getAdminProfile();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userEmail={profile?.email || "Guest"}
          userName={profile?.full_name}
        />
        <main className="w-full bg-accent overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
