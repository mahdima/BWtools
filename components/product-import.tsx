"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileUp, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/components/csv-exporter";
import { toCsv } from "@/lib/csv";
import { useTranslations } from "next-intl";
import { useRunWithToast } from "@/lib/use-toast-action";
import { IMPORT_TEMPLATE_HEADERS, MAX_IMPORT_CHARS } from "@/lib/product-import";
import {
  importProducts,
  previewProductImport,
  type ImportPreviewResult,
  type ImportPreviewRow,
} from "@/app/(dashboard)/product/actions";

// CSV import of products (P7-03): choose a file, check the preview, then import the
// rows that are ready. The server checks the file again on import. The template's
// example rows use one of the store's own categories and brands.
export function ProductImport({ exampleCategory, exampleBrand }: { exampleCategory: string; exampleBrand: string }) {
  const t = useTranslations("products.import");
  const router = useRouter();
  const runToast = useRunWithToast();
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_CHARS) {
      toast.error(t("tooLarge"));
      return;
    }
    startTransition(async () => {
      const text = await file.text();
      setCsv(text);
      setFileName(file.name);
      try {
        const result = await previewProductImport(text);
        setPreview(result);
      } catch (error) {
        console.error(error);
        setPreview({ success: false, message: t("checkFailed") });
      }
    });
  };

  const runImport = () => {
    if (!csv) return;
    startTransition(async () => {
      if (await runToast(() => importProducts(csv))) router.push("/product");
    });
  };

  const validCount = preview?.validCount ?? 0;
  const rows = preview?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-strong ${
            isPending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {isPending && !preview ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {fileName ? t("chooseAnother") : t("chooseFile")}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = ""; // choosing the same file again re-checks it
            }}
          />
        </label>
        <Button
          variant="outline"
          className="h-10 gap-2 bg-background"
          onClick={() =>
            downloadCsv(
              toCsv(IMPORT_TEMPLATE_HEADERS, [
                ["Perceuse sans fil 18V", "12500", "4", exampleCategory, exampleBrand, "2 batteries, chargeur inclus"],
                ["Pelle carrée", "900", "20", exampleCategory, exampleBrand, ""],
              ]),
              "products-template.csv",
            )
          }
        >
          <Download className="h-4 w-4" /> {t("downloadTemplate")}
        </Button>
        {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
      </div>

      {preview && !preview.success && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-400">
          {preview.message}
        </div>
      )}

      {preview?.success && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <h2 className="font-bold text-foreground">{t("preview")}</h2>
              <p className="text-sm text-muted-foreground">
                {preview.message}
                {validCount < rows.length && ` ${t("skippedHint")}`}
              </p>
            </div>
            <Button
              className="bg-primary text-white hover:bg-primary-strong"
              disabled={isPending || validCount === 0}
              onClick={runImport}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("importButton", { count: validCount })}
            </Button>
          </div>
          <ImportPreviewTable rows={rows} />
        </section>
      )}
    </div>
  );
}

// The checked rows of an import: what will be created, and why a row is skipped.
export function ImportPreviewTable({ rows }: { rows: ImportPreviewRow[] }) {
  const t = useTranslations("products.import");
  return (
    <div className="max-h-[60vh] overflow-auto">
      <table className="w-full min-w-[760px] text-start text-sm">
        <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">{t("row")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("name")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("category")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("brand")}</th>
            <th scope="col" className="px-4 py-2 text-end font-medium">{t("price")}</th>
            <th scope="col" className="px-4 py-2 text-end font-medium">{t("stock")}</th>
            <th scope="col" className="px-4 py-2 font-medium">{t("status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.row} className="border-t border-border align-top">
              <td className="px-4 py-2 tabular-nums text-muted-foreground">{row.row}</td>
              <td className="px-4 py-2 font-medium text-foreground">{row.name || "—"}</td>
              <td className="px-4 py-2 text-foreground/80">{row.category || "—"}</td>
              <td className="px-4 py-2 text-foreground/80">{row.brand || "—"}</td>
              <td className="px-4 py-2 text-end tabular-nums text-foreground/80">{row.price || "—"}</td>
              <td className="px-4 py-2 text-end tabular-nums text-foreground/80">{row.quantity || "0"}</td>
              <td className="px-4 py-2">
                {row.errors.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> {t("ready")}
                  </span>
                ) : (
                  <ul className="space-y-0.5 text-red-700 dark:text-red-400">
                    {row.errors.map((error) => (
                      <li key={error} className="flex items-start gap-1">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
