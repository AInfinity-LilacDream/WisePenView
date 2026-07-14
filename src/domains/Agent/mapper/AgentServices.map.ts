import { ResourceServicesMap } from '@/domains/Resource/mapper/ResourceServices.map';
import type {
  AgentInfoApiResponse,
  AgentSpecApi,
  AgentVersionBundleApiResponse,
} from '../apis/AgentApi.type';
import type { AgentDetail, AgentSpec } from '../entity/agent';

export const DEFAULT_AGENT_SPEC: AgentSpec = {
  systemPrompt: '',
  autoGenerateTitle: true,
  modelPolicy: { defaultModelId: '', defaultProviderId: '', allowRequestOverride: true },
  toolAndSkillPolicy: {
    enableUseTool: true,
    allowToolNames: [],
    denyToolNames: [],
    enableUseSkill: true,
    onDemandSkillIds: [],
    forceEnabledSkillIds: [],
  },
  memoryPolicy: {
    enableChatMemory: true,
    enablePersistenceChatMemory: true,
    enableChatMemorySummary: true,
    highWatermarkRatio: 0.8,
    lowWatermarkRatio: 0.5,
    summaryPrompt: '',
    enableLongTermMemory: false,
    longTermMemoryLimit: 10,
    longTermMemoryScoreThreshold: 0.6,
  },
};

const mapSpec = (spec?: AgentSpecApi | null): AgentSpec => ({
  systemPrompt: spec?.systemPrompt ?? DEFAULT_AGENT_SPEC.systemPrompt,
  autoGenerateTitle: spec?.autoGenerateTitle ?? DEFAULT_AGENT_SPEC.autoGenerateTitle,
  modelPolicy: {
    defaultModelId: spec?.modelPolicy?.defaultModelId ?? '',
    defaultProviderId: spec?.modelPolicy?.defaultProviderId ?? '',
    allowRequestOverride:
      spec?.modelPolicy?.allowRequestOverride ??
      DEFAULT_AGENT_SPEC.modelPolicy.allowRequestOverride,
  },
  toolAndSkillPolicy: {
    enableUseTool:
      spec?.toolAndSkillPolicy?.enableUseTool ??
      DEFAULT_AGENT_SPEC.toolAndSkillPolicy.enableUseTool,
    allowToolNames: [...(spec?.toolAndSkillPolicy?.allowToolNames ?? [])],
    denyToolNames: [...(spec?.toolAndSkillPolicy?.denyToolNames ?? [])],
    enableUseSkill:
      spec?.toolAndSkillPolicy?.enableUseSkill ??
      DEFAULT_AGENT_SPEC.toolAndSkillPolicy.enableUseSkill,
    onDemandSkillIds: [...(spec?.toolAndSkillPolicy?.onDemandSkillIds ?? [])],
    forceEnabledSkillIds: [...(spec?.toolAndSkillPolicy?.forceEnabledSkillIds ?? [])],
  },
  memoryPolicy: {
    enableChatMemory:
      spec?.memoryPolicy?.enableChatMemory ?? DEFAULT_AGENT_SPEC.memoryPolicy.enableChatMemory,
    enablePersistenceChatMemory:
      spec?.memoryPolicy?.enablePersistenceChatMemory ??
      DEFAULT_AGENT_SPEC.memoryPolicy.enablePersistenceChatMemory,
    enableChatMemorySummary:
      spec?.memoryPolicy?.enableChatMemorySummary ??
      DEFAULT_AGENT_SPEC.memoryPolicy.enableChatMemorySummary,
    highWatermarkRatio:
      spec?.memoryPolicy?.highWatermarkRatio ?? DEFAULT_AGENT_SPEC.memoryPolicy.highWatermarkRatio,
    lowWatermarkRatio:
      spec?.memoryPolicy?.lowWatermarkRatio ?? DEFAULT_AGENT_SPEC.memoryPolicy.lowWatermarkRatio,
    summaryPrompt: spec?.memoryPolicy?.summaryPrompt ?? '',
    enableLongTermMemory:
      spec?.memoryPolicy?.enableLongTermMemory ??
      DEFAULT_AGENT_SPEC.memoryPolicy.enableLongTermMemory,
    longTermMemoryLimit:
      spec?.memoryPolicy?.longTermMemoryLimit ??
      DEFAULT_AGENT_SPEC.memoryPolicy.longTermMemoryLimit,
    longTermMemoryScoreThreshold:
      spec?.memoryPolicy?.longTermMemoryScoreThreshold ??
      DEFAULT_AGENT_SPEC.memoryPolicy.longTermMemoryScoreThreshold,
  },
});

const mapAgentDetail = (params: {
  resourceId: string;
  info?: AgentInfoApiResponse;
  bundle?: AgentVersionBundleApiResponse;
  currentUserId: string;
}): AgentDetail => {
  const resource = params.info?.resourceInfo
    ? ResourceServicesMap.mapResourceItemFromApi(params.info.resourceInfo)
    : undefined;
  const publishedVersion = params.info?.agentInfo?.version ?? 0;
  const version = params.bundle?.version ?? publishedVersion + 1;
  return {
    resourceId: params.resourceId,
    title: resource?.resourceName ?? 'Agent',
    name: params.info?.agentInfo?.name ?? '',
    description: params.info?.agentInfo?.description ?? '',
    publishedVersion,
    draftVersion: publishedVersion + 1,
    version,
    status: params.bundle?.status ?? 'DRAFT',
    spec: mapSpec(params.bundle?.spec),
    assets: (params.bundle?.assets ?? []).map((asset) => ({
      id: asset.id ?? '',
      name: asset.name ?? '',
      path: asset.path ?? '/',
      objectKey: asset.objectKey,
      assetResourceType: asset.assetResourceType ?? 'TEXT',
      uploadStatus: asset.uploadStatus ?? 'UPLOADING',
      size: asset.size ?? 0,
    })),
    ownerId: resource?.ownerId,
    isOwner: resource?.ownerId === params.currentUserId,
    currentActions: resource?.currentActions,
  };
};

export const AgentServicesMap = { mapAgentDetail, mapSpec };
