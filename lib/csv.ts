import type { ActionResult } from "@/lib/action-result";

// What a CSV export action returns: the file contents on success.
export type CsvExportResult = ActionResult & { csv?: string; filename?: string };

// One CSV field (RFC 4180): quoted when it contains a comma, quote or line break,
// with inner quotes doubled. Text starting with = + - @ is prefixed with ' so
// spreadsheet apps don't run it as a formula (CSV injection); numbers are left as is.
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// A whole CSV file: CRLF line endings, plus a UTF-8 byte-order mark so Excel
// shows accented and Arabic text correctly.
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvField).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
