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
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon size={20} />
      <span>{name}</span>
    </Link>
  );
};

export default Sidebaritem;
