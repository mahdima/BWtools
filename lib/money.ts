const wholeDinars = new Intl.NumberFormat("fr-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

// An amount in whole dinars with the local "DA" symbol, as on the dashboard cards.
export function formatDA(amount: number): string {
  return wholeDinars.format(amount).replace("DZD", "DA");
}
