import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";


export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ProtectedRoute>
            <Navbar />
            <div className="flex h-[91vh]">
                <Sidebar />
                <div className=" w-full bg-accent">{children}</div>
            </div>
        </ProtectedRoute>
    );
}
