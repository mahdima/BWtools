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

interface ISidebarItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const items: ISidebarItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Product",
    path: "/product",
    icon: ShoppingCart,
  },
  {
    name: "Branding",
    path: "/brand",
    icon: Tag,
  },
  {
    name: "Customers",
    path: "/customers",
    icon: ShieldUser,
  },
  {
    name: "Categories",
    path: "/categories",
    icon: Layers,
  },
  {
    name: "Order",
    path: "/order",
    icon: ShoppingBag,
  },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
}

const Sidebar = ({ userEmail = "Guest", userName }: SidebarProps) => {
  const displayName = userName || userEmail.split("@")[0];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-full py-6 transition-all duration-300">
      {/* Top: Logo */}
      <div className="flex justify-center mb-8 px-6">
        <Image
          className="w-auto h-10 object-contain"
          src={logo}
          alt="bwtools"
        />
      </div>

      {/* Middle: Navigation */}
      <div className="flex flex-col space-y-1 w-[85%] mx-auto flex-1">
        {items.map((item) => (
          <Sidebaritem key={item.path} item={item} />
        ))}
      </div>

      {/* Bottom: User Profile Dropdown */}
      <div className="px-4 pt-4 border-t border-gray-100 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
              <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={man}
                  alt="user"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <p
                  className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors"
                  title={userName ? `${userName} (${userEmail})` : userEmail}
                >
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-500">Admin Account</p>
              </div>
              <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 mb-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/profile" className="flex items-center w-full">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
              <Link href="/logout" className="flex items-center w-full">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
