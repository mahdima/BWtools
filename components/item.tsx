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
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out ${
        isActive
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon
        size={18}
        className={`transition-colors duration-300 ${
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span>{name}</span>
    </Link>
  );
};

export default Sidebaritem;
