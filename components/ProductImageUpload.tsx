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
      <div className="w-full h-[300px] rounded-xl mb-4 overflow-hidden bg-muted/20 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors relative group glass-card">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="text-muted-foreground flex flex-col items-center cursor-pointer hover:text-primary transition-colors"
            onClick={handleTriggerClick}
          >
            <Plus className="h-10 w-10 mb-2" />
            <span className="text-sm font-medium">Select Product Image</span>
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

      <div className="flex gap-4 w-full justify-center">
        {preview && (
          <>
            <button
              type="button"
              onClick={handleTriggerClick}
              className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              Change Image
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
};
