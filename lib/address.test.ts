import { describe, expect, it } from "vitest";
import { formatAddressLines, type ShippingAddress } from "@/lib/address";

const base: ShippingAddress = {
  fullName: "Amina B.",
  phone: "+213555123456",
  street: "12 Rue Didouche Mourad",
  city: "Alger",
  state: "Sidi M'Hamed",
  zipCode: "16000",
  country: "Algeria",
};

describe("formatAddressLines", () => {
  it("formats a full address", () => {
    expect(formatAddressLines(base)).toEqual([
      "Amina B.",
      "12 Rue Didouche Mourad",
      "16000 Alger",
      "Sidi M'Hamed",
      "Algeria",
    ]);
  });

  it("leaves out missing zip code and state", () => {
    expect(formatAddressLines({ ...base, zipCode: null, state: null })).toEqual([
      "Amina B.",
      "12 Rue Didouche Mourad",
      "Alger",
      "Algeria",
    ]);
  });

  it("skips a state that repeats the city and trims blanks", () => {
    expect(formatAddressLines({ ...base, state: " alger ", zipCode: "  ", fullName: " Amina B. " })).toEqual([
      "Amina B.",
      "12 Rue Didouche Mourad",
      "Alger",
      "Algeria",
    ]);
  });
});
