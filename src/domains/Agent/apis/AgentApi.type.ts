import type { ResourceItemApiResponse } from '@/domains/Resource/apis/ResourceApi.type';

export type AgentVersionStatusApi = 'DRAFT' | 'PUBLISHED';
export type AgentAssetUploadStatusApi = 'UPLOADING' | 'AVAILABLE';

export interface AgentModelPolicyApi {
  defaultModelId?: string | null;
  defaultProviderId?: string | null;
  allowRequestOverride?: boolean | null;
}

export interface AgentToolAndSkillPolicyApi {
  enableUseTool?: boolean | null;
  allowToolNames?: string[] | null;
  denyToolNames?: string[] | null;
  enableUseSkill?: boolean | null;
  onDemandSkillIds?: string[] | null;
  forceEnabledSkillIds?: string[] | null;
}

export interface AgentMemoryPolicyApi {
  enableChatMemory?: boolean | null;
  enablePersistenceChatMemory?: boolean | null;
  enableChatMemorySummary?: boolean | null;
  highWatermarkRatio?: number | null;
  lowWatermarkRatio?: number | null;
  summaryPrompt?: string | null;
  enableLongTermMemory?: boolean | null;
  longTermMemoryLimit?: number | null;
  longTermMemoryScoreThreshold?: number | null;
}

export interface AgentSpecApi {
  systemPrompt?: string | null;
  autoGenerateTitle?: boolean | null;
  modelPolicy?: AgentModelPolicyApi | null;
  toolAndSkillPolicy?: AgentToolAndSkillPolicyApi | null;
  memoryPolicy?: AgentMemoryPolicyApi | null;
}

export interface AgentAssetApiInfo {
  id?: string;
  name?: string;
  path?: string;
  objectKey?: string;
  assetResourceType?: string;
  uploadStatus?: AgentAssetUploadStatusApi;
  size?: number;
}

export interface AgentInfoApiResponse {
  resourceInfo?: ResourceItemApiResponse;
  agentInfo?: {
    name?: string;
    description?: string;
    version?: number;
    sourceType?: string;
  };
}

export interface AgentVersionBundleApiResponse {
  version?: number;
  status?: AgentVersionStatusApi;
  assets?: AgentAssetApiInfo[];
  resourceId?: string;
  spec?: AgentSpecApi | null;
}

export interface AgentUploadTicketApiResponse {
  assetId?: string;
  path?: string;
  name?: string;
  objectKey?: string;
  putUrl?: string;
  callbackHeader?: string;
  flashUploaded?: boolean;
}

export interface CreateAgentApiRequest {
  title: string;
  name?: string;
  description?: string;
  sourceType?: string;
}

export interface UpdateAgentInfoApiRequest {
  resourceId: string;
  name?: string;
  description?: string;
}

export interface UpdateAgentSpecApiRequest {
  resourceId: string;
  draftVersion: number;
  spec: AgentSpecApi;
}

export interface InitUploadAgentAssetsApiRequest {
  resourceId: string;
  draftVersion: number;
  assets: Array<{
    name: string;
    path: string;
    assetResourceType: string;
    md5?: string;
    expectedSize?: number;
  }>;
}

export interface DeleteAgentAssetsApiRequest {
  resourceId: string;
  draftVersion: number;
  assetIds: string[];
}
