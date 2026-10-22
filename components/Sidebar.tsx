"use client";
import {
  LayoutDashboard,
  LucideIcon,
  ShoppingCart,
  ShieldUser,
  Layers,
  ShoppingBag,
  Settings,
  LogOut,
  Tag,
  User,
  ChevronUp,
  History,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Sidebaritem from "./item";
import logo from "../img/Asset 3.png";
import man from "../img/man.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/notifications-panel";
import { useAdmin } from "@/components/admin-provider";
import { hasRole, type Role } from "@/lib/roles";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "@/components/language-picker";

interface ISidebarItem {
  // Key in messages/*.json "nav"
  name: "dashboard" | "products" | "brands" | "customers" | "categories" | "orders" | "reports" | "team" | "auditLog";
  path: string;
  icon: LucideIcon;
  // Shown only to admins with at least this role (the page checks it too)
  minRole?: Role;
}

const items: ISidebarItem[] = [
  {
    name: "dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "products",
    path: "/product",
    icon: ShoppingCart,
  },
  {
    name: "brands",
    path: "/brand",
    icon: Tag,
  },
  {
    name: "customers",
    path: "/customers",
    icon: ShieldUser,
  },
  {
    name: "categories",
    path: "/categories",
    icon: Layers,
  },
  {
    name: "orders",
    path: "/order",
    icon: ShoppingBag,
  },
  {
    name: "reports",
    path: "/reports",
    icon: BarChart3,
  },
  {
    name: "team",
    path: "/team",
    icon: ShieldUser,
  },
  {
    name: "auditLog",
    path: "/audit",
    icon: History,
    minRole: "super_admin",
  },
];

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  notifications?: Notification[];
}

const Sidebar = ({
  userEmail = "Guest",
  userName,
  notifications = [],
}: SidebarProps) => {
  const displayName = userName || userEmail.split("@")[0];
  const admin = useAdmin();
  const t = useTranslations("nav");
  const visibleItems = items.filter((item) => !item.minRole || (admin && hasRole(admin.role, item.minRole)));

  return (
    <div className="w-64 border-e border-sidebar-border bg-sidebar/50 backdrop-blur-xl flex flex-col justify-between h-full py-6 transition-all duration-300 relative z-20">
      {/* Top: Logo & Notifications */}
      <div className="flex justify-between items-center mb-10 px-6">
        <Image
          className="w-auto h-9 object-contain opacity-90 hover:opacity-100 transition-opacity"
          src={logo}
          alt="bwtools"
        />
        <NotificationsPanel notifications={notifications} />
      </div>

      {/* Middle: Navigation */}
      <div className="flex flex-col space-y-1.5 w-[88%] mx-auto flex-1">
        {visibleItems.map((item) => (
          <Sidebaritem key={item.path} item={{ ...item, name: t(item.name) }} />
        ))}
      </div>

      {/* Bottom: language, then the user profile dropdown */}
      <div className="px-4 pt-4 border-t border-sidebar-border mt-auto">
        <LanguagePicker className="mb-3 px-2.5" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors group border border-transparent hover:border-sidebar-border/50">
              <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-sidebar-accent border border-sidebar-border ring-2 ring-transparent group-hover:ring-sidebar-ring/30 transition-all">
                <Image
                  src={man}
                  alt="user"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <p
                  className="text-sm font-medium text-sidebar-foreground truncate transition-colors"
                  title={userName ? `${userName} (${userEmail})` : userEmail}
                >
                  {displayName}
                </p>
                <p className="text-[11px] text-sidebar-foreground/60 font-medium">
                  {t("adminAccount")}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="w-56 mb-2 bg-popover/80 backdrop-blur-md border-border p-1 shadow-lg shadow-black/5"
          >
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
              {t("myAccount")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground my-0.5"
              asChild
            >
              <Link href="/profile" className="flex items-center w-full">
                <User className="me-2 h-4 w-4" />
                <span>{t("myProfile")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground my-0.5"
              asChild
            >
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="me-2 h-4 w-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer rounded-md text-destructive focus:text-destructive focus:bg-destructive/10 my-0.5">
              <Link href="/logout" className="flex items-center w-full">
                <LogOut className="me-2 h-4 w-4" />
                <span>{t("logout")}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
