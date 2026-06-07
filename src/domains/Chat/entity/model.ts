/**
 * Chat 模型类型定义（已废弃，仅保留历史参考）
 * 实际定义已迁移至 @/types/model
 */
import type { ModelType } from '@/types/model';

/** 对齐后端 ModelResponse（已废弃，请使用 @/types/model::Model） */
export interface Model {
  id: string;
  display_name: string;
  vendor: string;
  type: ModelType;
  billing_ratio: number;
  support_thinking: boolean;
  support_vision: boolean;
  is_active: boolean;
}
