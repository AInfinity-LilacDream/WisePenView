/** 数字千分位格式化 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const trimTrailingZero = (value: string): string => value.replace(/\.0$/, '');

/** 数字紧凑格式化（1.2K / 3.4M） */
export function formatCompactNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1_000_000) {
    return `${trimTrailingZero((num / 1_000_000).toFixed(1))}M`;
  }

  if (absNum >= 1_000) {
    return `${trimTrailingZero((num / 1_000).toFixed(1))}K`;
  }

  return formatNumber(num);
}
