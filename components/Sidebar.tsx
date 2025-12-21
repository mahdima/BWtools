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
} from "lucide-react";
import Image from "next/image";
import Sidebaritem from "./item";
import logo from "../img/Asset 3.png";
import man from "../img/man.png";

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
  {
    name: "Setting",
    path: "/settings",
    icon: Settings,
  },
  {
    name: "Logout",
    path: "/logout",
    icon: LogOut,
  },
];

interface SidebarProps {
  userEmail?: string;
}

const Sidebar = ({ userEmail = "Guest" }: SidebarProps) => {
  return (
    <div className="w-[18%] bg-white border-r border-gray-200 flex flex-col justify-between h-full py-6">
      {/* Top: Logo */}
      <div className="flex justify-center mb-8 px-4">
        <Image
          className="w-auto h-12 object-contain"
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

      {/* Bottom: User Profile */}
      <div className="px-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-100">
            <Image
              src={man}
              alt="user"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <p
              className="text-xs font-medium text-[#0B1DFF] truncate"
              title={userEmail}
            >
              {userEmail}
            </p>
            <p className="text-[10px] text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
