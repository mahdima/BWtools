import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "@/lib/csv";

describe("csvField", () => {
  it("leaves plain values alone", () => {
    expect(csvField("Delivered")).toBe("Delivered");
    expect(csvField(1500.5)).toBe("1500.5");
    expect(csvField(0)).toBe("0");
  });

  it("writes null and undefined as empty", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks (RFC 4180)", () => {
    expect(csvField("Alger, Centre")).toBe('"Alger, Centre"');
    expect(csvField('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
    expect(csvField("a\r\nb")).toBe('"a\r\nb"');
  });

  it("neutralises formula injection in text", () => {
    expect(csvField("=HYPERLINK(\"http://x\")")).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvField("+213555")).toBe("'+213555");
    expect(csvField("-1+1")).toBe("'-1+1");
    expect(csvField("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("does not touch negative numbers", () => {
    expect(csvField(-5)).toBe("-5");
  });

  it("keeps non-ASCII text", () => {
    expect(csvField("Béjaïa")).toBe("Béjaïa");
    expect(csvField("الجزائر")).toBe("الجزائر");
  });
});

describe("toCsv", () => {
  it("starts with a BOM and uses CRLF line endings", () => {
    const csv = toCsv(["Order", "Status"], [[1, "New"], [2, "Delivered, late"]]);
    expect(csv).toBe('﻿Order,Status\r\n1,New\r\n2,"Delivered, late"\r\n');
  });

  it("writes just the header when there are no rows", () => {
    expect(toCsv(["A", "B"], [])).toBe("﻿A,B\r\n");
  });
});
