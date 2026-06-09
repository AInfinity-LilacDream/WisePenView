import type { ModelType } from '../enum/model';

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
