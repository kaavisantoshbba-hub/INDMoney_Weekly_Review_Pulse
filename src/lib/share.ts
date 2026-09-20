export function shareOf(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export function formatShare(count: number, total: number): string {
  return `${shareOf(count, total).toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}
