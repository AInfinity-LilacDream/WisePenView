/**
 * Chat 模型类型定义
 * 与 /chat/model/listModels 的响应结构对齐
 */
import type { ModelType } from '@/types/model';

/** 对齐后端 ModelInfo */
export interface Model {
  id: number;
  name: string;
  vendor: string;
  type: ModelType;
  ratio: number;
  support_thinking: boolean;
  support_vision: boolean;
  is_default: boolean;
}
