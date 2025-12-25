"use client";

import React, { useState, useRef } from "react";
import { Trash2, Plus } from "lucide-react";

interface ProductImageUploadProps {
  defaultValue?: string | null;
  name?: string;
}

export const ProductImageUpload = ({
  defaultValue,
  name = "productImage",
}: ProductImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [existingUrl, setExistingUrl] = useState<string | null>(
    defaultValue || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(defaultValue || null);
    setExistingUrl(defaultValue || null);
  }, [defaultValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExistingUrl(null); // Clear existing URL if a new file is chosen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setExistingUrl(null); // Clear the existing URL on remove
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[300px] rounded-lg mb-4 overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 relative group">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="text-gray-400 flex flex-col items-center cursor-pointer"
            onClick={handleTriggerClick}
          >
            <Plus className="h-10 w-10 " />
            <span>Selectionner une image produit</span>
          </div>
        )}

        {/* Hidden input to track existing URL for server actions */}
        <input
          type="hidden"
          name="existingImageUrl"
          value={existingUrl || ""}
        />
      </div>
      <input
        type="file"
        name={name}
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      <div className="flex gap-6">



      </div>
    </div >
  );
};
