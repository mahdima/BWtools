"use client";
import React, { useMemo } from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
interface ISidebarItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

const Sidebaritem = ({ item }: { item: ISidebarItem }) => {
  const { name, icon: Icon, path } = item;
  const pathname = usePathname();

  const isActive = useMemo(() => {
    return path === "/" ? pathname === path : pathname === path;
  }, [path, pathname]);

  return (
    <Link
      href={path}
      className={`flex items-center space-x-7 rounded-lg p-3 cursor-pointer hover:bg-[#f5f5ff] hover:text-[#0B1DFF] ${isActive ? "text-[#0B1DFF] bg-[#f5f5ff]" : "text-black"
        }`}
    >
      <Icon size={22} />
      <span className="text-sm font-medium">{name}</span>
    </Link>
  );
};

export default Sidebaritem;
