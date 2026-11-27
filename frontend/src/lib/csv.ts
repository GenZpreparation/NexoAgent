/**
 * Client-side CSV export for data already loaded in the browser.
 * Values are escaped per RFC 4180, and cells starting with = + - @ are prefixed
 * with an apostrophe to prevent spreadsheet formula injection.
 */
export type CsvColumn<T> = { header: string; value: (row: T) => string | number | boolean | null | undefined };

function escapeCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(","));
  return [head, ...body].join("\r\n");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string): void {
  // BOM so Excel opens UTF-8 (₹, Devanagari) correctly.
  downloadBlob(new Blob(["﻿", toCsv(rows, columns)], { type: "text/csv;charset=utf-8" }), filename);
}

export function datedFilename(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
}
