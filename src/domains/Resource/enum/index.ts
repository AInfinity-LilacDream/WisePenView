import type { EnumValue } from '@/utils/enum';
import { createEnum } from '@/utils/enum';

/** 资源类型 */
export const RESOURCE_TYPE = createEnum([
  { value: 'note', key: 'NOTE', label: '笔记' },
  { value: 'file', key: 'FILE', label: '文件' },
] as const);

/** 排序字段枚举 */
export const RESOURCE_SORT_BY = createEnum([
  { value: 'UPDATE_TIME', key: 'UPDATE_TIME', label: '更新时间' },
  { value: 'CREATE_TIME', key: 'CREATE_TIME', label: '创建时间' },
  { value: 'NAME', key: 'NAME', label: '名称' },
  { value: 'SIZE', key: 'SIZE', label: '大小' },
] as const);

/** 排序方向枚举 */
export const RESOURCE_SORT_DIR = createEnum([
  { value: 'ASC', key: 'ASC', label: '升序' },
  { value: 'DESC', key: 'DESC', label: '降序' },
] as const);

/** 标签查询逻辑：OR=包含任意标签，AND=包含全部标签 */
export const TAG_QUERY_LOGIC_MODE = createEnum([
  { value: 'OR', key: 'OR', label: '包含任意' },
  { value: 'AND', key: 'AND', label: '包含全部' },
] as const);

export type TagQueryLogicMode = EnumValue<typeof TAG_QUERY_LOGIC_MODE>;

export type ResourceSortBy = EnumValue<typeof RESOURCE_SORT_BY>;
export type ResourceSortDir = EnumValue<typeof RESOURCE_SORT_DIR>;
