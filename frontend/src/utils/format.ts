const vndNumberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const vndCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Format a VNĐ amount as `1.234.567 ₫` using the vi-VN locale. */
export function formatVnd(amount: number): string {
  return vndCurrencyFormatter.format(amount);
}

/** Format a plain quantity or count using vi-VN digit grouping. */
export function formatNumber(value: number): string {
  return vndNumberFormatter.format(value);
}
