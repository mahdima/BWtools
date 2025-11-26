import React from "react";
import {
  LayoutDashboard,
  LucideIcon,
  ShoppingCart,
  ShieldUser,
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
];

const Sidebar = () => {
  return (
    <div className="w-[18%] ">
      <div className="flex flex-col space-y-12 m-19 ">
        {items.map((item) => (
          <Sidebaritem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
