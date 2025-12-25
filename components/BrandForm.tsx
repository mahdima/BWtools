"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BrandFormProps {
  brand?: any;
  action: (formData: FormData) => Promise<void>;
  title: string;
}

export function BrandForm({ brand, action, title }: BrandFormProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#0B1DFF]">{title}</h1>

      <form action={action} className="bg-white rounded-lg">
        <div className="space-y-6">
          {/* Brand Name */}
          <div>
            <label
              htmlFor="brand"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Brand Name
            </label>
            <input
              type="text"
              id="brand"
              name="brand"
              defaultValue={brand?.brand_name || ""}
              className="px-4 py-2 block w-full rounded-md border border-gray-200 focus:border-[#0B1DFF] focus:ring-1 focus:ring-[#0B1DFF] h-11 text-sm text-gray-700 outline-none transition-all bg-gray-50/50 focus:bg-white"
              placeholder="Enter brand name"
              required
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100 justify-end">
          <Link href="/brand">
            <Button
              type="button"
              variant="ghost"
              className="px-8 h-11 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="px-8 h-11 bg-[#0B1DFF] text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          >
            {brand ? "Update Brand" : "Save Brand"}
          </Button>
        </div>
      </form>
    </div>
  );
}
