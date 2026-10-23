const wholeDinars = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

// Unicode left-to-right isolate (U+2066) and its closing mark (U+2069)
const LTR_ISOLATE = String.fromCharCode(0x2066);
const POP_ISOLATE = String.fromCharCode(0x2069);

// An amount in whole dinars with the local "DA" symbol, as on the dashboard cards.
// Isolated as left-to-right text so "12 500 DA" keeps its order inside Arabic text.
export function formatDA(amount: number): string {
  return `${LTR_ISOLATE}${wholeDinars.format(amount).replace("DZD", "DA")}${POP_ISOLATE}`;
}

const withCentimes = new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD" });

// A price with centimes ("12 500,00 DA"), isolated like formatDA.
export function formatPrice(amount: number): string {
  return `${LTR_ISOLATE}${withCentimes.format(amount).replace("DZD", "DA")}${POP_ISOLATE}`;
}
