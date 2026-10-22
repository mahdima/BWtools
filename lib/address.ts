// A row of the `addresses` table, in the shape the order loader returns.
export type ShippingAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  country: string;
};

// Postal lines for display, e.g. ["Amina B.", "12 Rue Didouche", "16000 Alger", "Alger", "Algeria"].
// Blank parts are left out, and the region is skipped when it just repeats the city.
export function formatAddressLines(address: ShippingAddress): string[] {
  const clean = (value: string | null) => value?.trim() ?? "";
  const city = clean(address.city);
  const state = clean(address.state);

  return [
    clean(address.fullName),
    clean(address.street),
    [clean(address.zipCode), city].filter(Boolean).join(" "),
    state.toLowerCase() === city.toLowerCase() ? "" : state,
    clean(address.country),
  ].filter(Boolean);
}
