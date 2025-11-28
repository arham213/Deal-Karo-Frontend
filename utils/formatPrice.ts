export default function formatPrice(num: number): string {
  const toOneDecimal = (n: number) => parseFloat(n.toFixed(1)).toString();

  if (num >= 1_00_00_000) {
    return toOneDecimal(num / 1_00_00_000) + " Crore";
  }
  if (num >= 1_00_000) {
    return toOneDecimal(num / 1_00_000) + " Lacs";
  }
  if (num >= 1_000) {
    return toOneDecimal(num / 1_000) + " K";
  }
  return toOneDecimal(num);
}