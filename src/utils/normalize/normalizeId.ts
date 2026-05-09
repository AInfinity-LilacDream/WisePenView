/** 将接口可能返回的 number 转为 string，避免大 ID 在 JSON 解析时精度丢失；前端统一用 string 表示 ID */
export function normalizeId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return '';
  return typeof id === 'string' ? id : String(id);
}
