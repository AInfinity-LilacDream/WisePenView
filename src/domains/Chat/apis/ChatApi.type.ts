export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  role: 'user' | 'assistant';
  model_id?: number | string | null;
  content?: string;
  parts?: MessagePartResponse[];
  tool_calls?: unknown[] | null;
  createdAt?: string;
  created_at?: string;
}

export interface MessagePartResponse {
  type: string;
  text: string | null;
  state: string | null;
  toolCallId: string | null;
  input: unknown;
  output: unknown;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPage?: number;
  total_page: number;
}

export interface ListModelsApiResponse {
  system_models: ModelResponse[];
  user_models: ModelResponse[];
}

export interface ModelProviderMappingResponse {
  model_id: string;
  provider_id: string;
  provider_name?: string | null;
  provider_model_name: string;
  support_runtime_options?: Record<string, unknown>;
  is_preferred: boolean;
  is_active: boolean;
  priority: number;
}

export interface ModelResponse {
  id: string;
  scope: string;
  display_name: string;
  type: number;
  model_family: string;
  billing_ratio: number;
  support_thinking: boolean;
  support_vision: boolean;
  support_tools: boolean;
  context_window_tokens?: number | null;
  max_output_tokens?: number | null;
  is_active: boolean;
  mappings?: ModelProviderMappingResponse[] | null;
}
export type CreateSessionApiRequest = { title?: string };
export type CreateSessionApiResponse = ChatSession;
export type RenameSessionApiRequest = { sessionId: string; newTitle?: string };
export type RenameSessionApiResponse = ChatSession;
export type DeleteSessionApiRequest = { sessionId: string };
export type DeleteSessionApiResponse = null;
export type ListSessionsApiRequest = { page?: number; size?: number };
export type ListSessionsApiResponse = PageResult<ChatSession>;
export type ListHistoryMessagesApiRequest = { sessionId: string; page?: number; size?: number };
export type ListHistoryMessagesApiResponse = PageResult<MessageResponse>;

export interface ToolOption {
  toolId: string;
  label: string;
}
export type ListToolsApiResponse = ToolOption[];

export interface UploadAttachmentResponse {
  attachment_id: string;
  filename?: string;
}
