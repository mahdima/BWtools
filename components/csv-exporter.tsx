"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CsvExporterProps {
  data: any[];
  filename?: string;
}

export function CsvExporter({
  data,
  filename = "export.csv",
}: CsvExporterProps) {
  const handleExport = () => {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`; // Quote strings with commas
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1 bg-background"
      onClick={handleExport}
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  );
}
