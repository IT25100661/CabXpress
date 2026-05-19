export function currency(value: number | string) {
  return `LKR ${Number(value).toLocaleString('en-LK')}`;
}
