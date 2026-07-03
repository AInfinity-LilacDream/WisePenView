import type { ModelType } from '../enum/model';

export interface ModelProviderMapping {
  model_id: string;
  provider_id: string;
  provider_name?: string | null;
  provider_model_name: string;
  support_runtime_options?: Record<string, unknown>;
  is_preferred: boolean;
  is_active: boolean;
  priority: number;
}

export interface Model {
  id: string;
  scope: string;
  display_name: string;
  type: ModelType;
  model_family: string;
  billing_ratio: number;
  support_thinking: boolean;
  support_vision: boolean;
  support_tools: boolean;
  context_window_tokens?: number | null;
  max_output_tokens?: number | null;
  is_active: boolean;
  mappings?: ModelProviderMapping[] | null;
}
