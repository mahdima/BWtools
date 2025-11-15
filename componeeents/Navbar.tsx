"use client";

import Image from "next/image";
import { Bell } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b-[1px] border-[#D5D5D5] shadow-sm">
      <div className="w-[90%] mx-auto  h-[10vh] flex items-center justify-between">
        {/* Left - Logo */}
        <div>
          <Image
            src="/Asset 3.png"
            alt="Logo"
            width={147}
            height={70}
            className="object-contain"
          />
        </div>

        {/* Right - Notification + Avatar + Name */}
        <div className="flex items-center space-x-6">
          {/* Notification Icon */}
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {/* Avatar + Name */}
          <p className="font-medium text-gray-800">ALA ALA</p>

          <div>
            <Image
              src="/man.png"
              alt="User Avatar"
              width={46}
              height={46}
              className="rounded-full"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
