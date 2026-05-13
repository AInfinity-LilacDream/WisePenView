import type { EnumValue } from '@/utils/enum';
import { createEnum } from '@/utils/enum';

/** 供应商 ID（对齐后端 ProviderId 枚举值） */
export const MODEL_PROVIDER_ID = createEnum([
  { value: 1, key: 'ZHIZENGZENG', label: '智增增' },
  { value: 2, key: 'APIYI', label: 'API易' },
  { value: 3, key: 'MODELSCOPE', label: 'ModelScope' },
] as const);

export type ModelProviderId = EnumValue<typeof MODEL_PROVIDER_ID>;

/** 模型类型（对齐后端 ModelType 枚举值） */
export const MODEL_TYPE = createEnum([
  { value: 1, key: 'STANDARD_MODEL', label: '标准模型' },
  { value: 2, key: 'ADVANCED_MODEL', label: '高级模型' },
  { value: 3, key: 'UNKNOWN_MODEL', label: '未知模型' },
] as const);

export type ModelType = EnumValue<typeof MODEL_TYPE>;
