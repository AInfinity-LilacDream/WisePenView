/**
 * Chat 模型类型定义
 * 对齐 /chat/model/listAvailableModels 的响应结构
 */

/** 供应商 ID（对齐后端 ProviderId 枚举值） */
export const MODEL_PROVIDER_ID = {
  ZHIZENGZENG: 1,
  APIYI: 2,
  MODELSCOPE: 3,
} as const;

export type ModelProviderId = (typeof MODEL_PROVIDER_ID)[keyof typeof MODEL_PROVIDER_ID];

/** 模型类型（对齐后端 ModelType 枚举值） */
export const MODEL_TYPE = {
  STANDARD_MODEL: 1,
  ADVANCED_MODEL: 2,
  UNKNOWN_MODEL: 3,
} as const;

export type ModelType = (typeof MODEL_TYPE)[keyof typeof MODEL_TYPE];

/** 对齐后端 ModelResponse */
export interface Model {
  id: string;
  scope: string;
  display_name: string;
  vendor: string;
  type: ModelType;
  billing_ratio: number;
  support_thinking: boolean;
  support_vision: boolean;
  support_tools: boolean;
  support_streaming: boolean;
  context_window_tokens?: number | null;
  max_output_tokens?: number | null;
  is_active: boolean;
}
