export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
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

interface ModelResponse {
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
export type CreateSessionApiRequest = { title?: string | null; agent_id?: string | null };
export type CreateSessionApiResponse = ChatSession;
export type RenameSessionApiRequest = { session_id: string; new_title?: string | null };
export type RenameSessionApiResponse = ChatSession;
export type DeleteSessionApiRequest = { session_id: string };
export type DeleteSessionApiResponse = null;
export type ListSessionsApiRequest = { page?: number; size?: number };
export type ListSessionsApiResponse = PageResult<ChatSession>;
export type ListHistoryMessagesApiRequest = { session_id: string; page?: number; size?: number };
export type ListHistoryMessagesApiResponse = PageResult<MessageResponse>;

export interface InitTemporaryAttachmentUploadApiRequest {
  session_id: string;
  filename: string;
  extension: string;
  file_size: number;
  md5: string;
  enable_library?: boolean;
}

export interface InitTemporaryAttachmentUploadApiResponse {
  attachment_id: string;
  object_key: string;
  put_url: string;
  callback_header?: string;
}
