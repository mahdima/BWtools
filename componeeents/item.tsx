import React from "react";
import { LucideIcon } from "lucide-react";
interface ISidebarItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const Sidebaritem = ({ item }: { item: ISidebarItem }) => {
  const { name, icon: Icon } = item;
  return (
    <div className="flex items-center space-x-2 ">
      <Icon />
      <span className="text-md font-medium">{name}</span>
    </div>
  );
};

export default Sidebaritem;
