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
import path from "path";
import Sidebaritem from "./item";

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

const Sidebar = () => {
  return (
    <div className="w-[18%] ">
      <div className="flex flex-col space-y-2 w-[80%] mx-auto my-12 ">
        {items.map((item) => (
          <Sidebaritem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
