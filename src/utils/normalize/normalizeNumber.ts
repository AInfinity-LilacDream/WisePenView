/** 将 API 数值归一化为有限 number，拒绝空字符串和其它隐式可转换类型。 */
export function normalizeFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

/** 将计数、额度和字节数等非负 API 数值归一化为 number。 */
export function normalizeNonNegativeNumber(value: unknown): number | undefined {
  const normalized = normalizeFiniteNumber(value);
  return normalized != null && normalized >= 0 ? normalized : undefined;
}
