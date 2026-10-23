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

// Parses CSV text (RFC 4180: quoted fields, doubled quotes, line breaks inside quotes)
// into rows of fields. The separator is a comma or, as French Excel saves it, a
// semicolon, whichever the first line uses more. A UTF-8 byte-order mark and blank
// lines are dropped.
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const firstLine = input.slice(0, input.search(/\r?\n|$/));
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((fields) => fields.some((value) => value.trim() !== ""));
}

// A whole CSV file: CRLF line endings, plus a UTF-8 byte-order mark so Excel
// shows accented and Arabic text correctly.
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(csvField).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
