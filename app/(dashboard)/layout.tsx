import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userName = user?.email || "Guest";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userEmail={userName} />
        <main className="w-full bg-accent overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
