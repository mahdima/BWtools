"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CsvExportResult } from "@/lib/csv";

interface CsvExporterProps {
  // A server action (bound to the current filters) that builds the whole file
  action: () => Promise<CsvExportResult>;
}

// Saves CSV text as a file in the browser (also used for the import template).
export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CsvExporter({ action }: CsvExporterProps) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success || result.csv === undefined) {
          toast.error(result.message);
          return;
        }
        downloadCsv(result.csv, result.filename ?? "export.csv");
        toast.success(result.message);
      } catch (error) {
        console.error(error);
        toast.error("Export failed. Please try again.");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1 bg-background"
      onClick={handleExport}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Export CSV
    </Button>
  );
}
