import { buildDriveNodeScope, type DriveNode } from '@/domains/Drive';
import type { Group } from '@/domains/Group';
import type { ResourceItem } from '@/domains/Resource';
import { useCurrentChatSessionStore, useNewChatSessionStore, useNoteSelectionStore } from '@/store';
import { createClientError, FRONTEND_CLIENT_ERROR } from '@/utils/error';
import { ChatApi, ChatSessionApi } from '../apis/ChatApi';
import { buildAgentFromResourceItem, buildDefaultPersonalAgent } from '../mapper/agent.mapper';
import { ChatServicesMap } from '../mapper/ChatServices.map';
import { buildAdvancedSkillTreeGroups, getPrimarySkillsForAgent } from '../mapper/skillScope.mapper';
import { mapResourceItemToSkillSummary } from '../mapper/workspace.mapper';
import type {
  ChatDocumentPickerNode,
  ChatDocumentPickerScope,
  ChatInputCapabilityOptions,
  ChatModel,
  ChatServiceDeps,
  ChatSession,
  ChatWorkspace,
  CreateSessionRequest,
  DeleteSessionRequest,
  GetChatInputCapabilityOptionsParams,
  IChatService,
  ListDocumentPickerChildrenRequest,
  ListHistoryMessagesRequest,
  ListSessionsRequest,
  MessageResponse,
  PageResult,
  RenameSessionRequest,
  ToolOption,
  UploadAttachmentParams,
  UploadAttachmentResult,
} from './index.type';

interface GroupResourceBatch {
  group: Group;
  list: ResourceItem[];
}

const getModels = async (): Promise<ChatModel[]> => {
  const data = await ChatApi.listModels();
  return ChatServicesMap.mapGetModelsFromApi(data);
};

const fetchAllGroups = async (deps: ChatServiceDeps): Promise<Group[]> => {
  const [joinedData, managedData] = await Promise.all([
    deps.groupService.fetchGroupList({ groupRoleFilter: 'JOINED', page: 1, size: 100 }),
    deps.groupService.fetchGroupList({ groupRoleFilter: 'MANAGED', page: 1, size: 100 }),
  ]);

  const seenGroupIds = new Set<string>();
  return [...(joinedData?.groups ?? []), ...(managedData?.groups ?? [])].filter((group) => {
    if (seenGroupIds.has(group.groupId)) return false;
    seenGroupIds.add(group.groupId);
    return true;
  });
};

const fetchAllSkills = async (
  deps: ChatServiceDeps,
  groups: Group[]
): Promise<ChatWorkspace['skills']> => {
  const requests = [
    deps.resourceService.getUserResources({
      page: 1,
      size: 200,
      sortBy: 'NAME',
      sortDir: 'ASC',
      resourceType: 'SKILL',
    }),
    ...groups.map((group) =>
      deps.resourceService.getGroupResources({
        groupId: group.groupId,
        page: 1,
        size: 200,
        sortBy: 'NAME',
        sortDir: 'ASC',
        resourceType: 'SKILL',
      })
    ),
  ];

  const results = await Promise.all(requests);
  const [personalResult, ...groupResults] = results;

  return [
    ...(personalResult?.list ?? []).map((item) => mapResourceItemToSkillSummary(item)),
    ...groups.flatMap((group, i) =>
      (groupResults[i]?.list ?? []).map((item) =>
        mapResourceItemToSkillSummary(item, { groupId: group.groupId, groupName: group.groupName })
      )
    ),
  ];
};

const fetchAllAgents = async (
  deps: ChatServiceDeps,
  groups: Group[]
): Promise<Pick<ChatWorkspace, 'personalAgents' | 'groupAgents'>> => {
  const requests: Array<Promise<ResourceItem[] | GroupResourceBatch>> = [
    deps.resourceService
      .getUserResources({
        page: 1,
        size: 200,
        sortBy: 'NAME',
        sortDir: 'ASC',
        resourceType: 'AGENT',
      })
      .then((res) => res.list),
    ...groups.map((group) =>
      deps.resourceService
        .getGroupResources({
          groupId: group.groupId,
          page: 1,
          size: 200,
          sortBy: 'NAME',
          sortDir: 'ASC',
          resourceType: 'AGENT',
        })
        .then((res): GroupResourceBatch => ({ list: res.list, group }))
    ),
  ];

  const results = await Promise.all(requests);
  const [personalList, ...groupBatches] = results;

  const personalAgents = ((personalList as ResourceItem[]) ?? []).map((item) =>
    buildAgentFromResourceItem(item)
  );

  const groupAgents = (groupBatches as GroupResourceBatch[]).flatMap((batch) =>
    (batch?.list ?? []).map((item) =>
      buildAgentFromResourceItem(item, {
        groupId: batch.group.groupId,
        groupName: batch.group.groupName,
      })
    )
  );

  return { personalAgents, groupAgents };
};

const getWorkspace = async (deps: ChatServiceDeps): Promise<ChatWorkspace> => {
  const groups = await fetchAllGroups(deps);
  const [skills, agentData] = await Promise.all([
    fetchAllSkills(deps, groups),
    fetchAllAgents(deps, groups),
  ]);
  return { groups, skills, ...agentData };
};

const getChatInputAgents = async (
  deps: ChatServiceDeps
): Promise<ChatWorkspace['personalAgents']> => {
  const workspace = await getWorkspace(deps);
  return [buildDefaultPersonalAgent(), ...workspace.personalAgents, ...workspace.groupAgents];
};

const getChatInputCapabilityOptions = async (
  deps: ChatServiceDeps,
  params: GetChatInputCapabilityOptionsParams
): Promise<ChatInputCapabilityOptions> => {
  const [workspace, tools] = await Promise.all([getWorkspace(deps), getTools()]);
  const primarySkills = getPrimarySkillsForAgent(workspace.skills, params.agent);
  const primaryIds = new Set(primarySkills.map((skill) => skill.skillId));
  const otherSkillGroups = buildAdvancedSkillTreeGroups(
    workspace.skills,
    workspace.groups,
    params.agent,
    primarySkills
  )
    .map((group) => ({
      ...group,
      skills: group.skills.filter((skill) => !primaryIds.has(skill.skillId)),
    }))
    .filter((group) => group.skills.length > 0);

  return {
    primarySkills,
    otherSkillGroups,
    tools,
  };
};

const getDocumentPickerScopes = async (
  deps: ChatServiceDeps
): Promise<ChatDocumentPickerScope[]> => {
  const groups = await fetchAllGroups(deps);
  const personalScope = buildDriveNodeScope();
  return [
    {
      scopeKey: 'personal',
      label: '个人文件',
      rootId: personalScope.rootId,
      type: 'personal',
    },
    ...groups.map((group) => {
      const groupScope = buildDriveNodeScope(group.groupId);
      return {
        scopeKey: `group:${group.groupId}`,
        label: group.groupName,
        rootId: groupScope.rootId,
        type: 'group' as const,
        groupId: group.groupId,
      };
    }),
  ];
};

const getDriveNodeTitle = (node: DriveNode): string => {
  switch (node.type) {
    case 'root':
      return node.name || '云盘';
    case 'folder':
      return node.name || '未命名文件夹';
    case 'resource':
    case 'link':
      return node.title || node.resourceId;
    case 'loading':
      return node.label || '';
  }
};

const mapDriveNodeToDocumentPickerNode = (
  node: DriveNode
): ChatDocumentPickerNode | null => {
  if (node.type === 'loading') return null;

  const groupId = node.scope.type === 'group' ? node.scope.groupId : null;
  const base = {
    nodeId: node.id,
    title: getDriveNodeTitle(node),
    type: node.type,
    groupId,
    resourceId: null,
    resourceName: null,
    resourceType: null,
    isLeaf: node.type === 'resource' || node.type === 'link',
    selectable: node.type === 'resource' || node.type === 'link',
  };

  if (node.type === 'resource' || node.type === 'link') {
    return {
      ...base,
      resourceId: node.resourceId,
      resourceName: node.title || node.resourceId,
      resourceType: node.resourceType ?? '',
    };
  }

  return base;
};

const listDocumentPickerChildren = async (
  deps: ChatServiceDeps,
  params: ListDocumentPickerChildrenRequest
): Promise<ChatDocumentPickerNode[]> => {
  const rootNode = params.parentNodeId
    ? null
    : await deps.driveService.getRootNode({
        rootId: params.rootId,
        groupId: params.groupId,
      });
  const parentNodeId = params.parentNodeId ?? rootNode?.id;
  if (!parentNodeId) return [];

  const children = await deps.driveService.listNodeChildren({
    nodeId: parentNodeId,
    groupId: params.groupId,
  });

  return children
    .map((node) => mapDriveNodeToDocumentPickerNode(node))
    .filter((node): node is ChatDocumentPickerNode => Boolean(node));
};

const createSession = async (params?: CreateSessionRequest): Promise<ChatSession> => {
  const payload = ChatServicesMap.mapCreateSessionRequest(params);
  const data = await ChatSessionApi.createSession(payload);
  if (!data) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_CREATE_SESSION_FAILED);
  }
  return ChatServicesMap.mapCreateSessionFromApi(data);
};

const renameSession = async (params: RenameSessionRequest): Promise<ChatSession> => {
  const payload = ChatServicesMap.mapRenameSessionRequest(params);
  const data = await ChatSessionApi.renameSession(payload);
  if (!data) {
    throw createClientError(FRONTEND_CLIENT_ERROR.CHAT_RENAME_SESSION_FAILED);
  }
  return ChatServicesMap.mapRenameSessionFromApi(data);
};

const deleteSession = async (params: DeleteSessionRequest): Promise<void> => {
  await ChatSessionApi.deleteSession({ sessionId: params.sessionId });
  useCurrentChatSessionStore.getState().clearCurrentSessionById(params.sessionId);
  useNewChatSessionStore.getState().clearNewChatSessionById(params.sessionId);
  useNoteSelectionStore.getState().clearSelectedText(params.sessionId);
};

const listSessions = async (params?: ListSessionsRequest): Promise<PageResult<ChatSession>> => {
  const query = ChatServicesMap.mapListSessionsRequest(params);
  const payload = await ChatSessionApi.listSessions(query);
  return ChatServicesMap.mapListSessionsFromApi(payload);
};

const listHistoryMessages = async (
  params: ListHistoryMessagesRequest
): Promise<PageResult<MessageResponse>> => {
  const query = ChatServicesMap.mapListHistoryMessagesRequest(params);
  const payload = await ChatSessionApi.listHistoryMessages(query);
  return ChatServicesMap.mapListHistoryMessagesFromApi(payload);
};

const getTools = async (): Promise<ToolOption[]> => {
  return await ChatApi.getTools();
};

const uploadAttachment = async ({
  file,
  saveToLibrary,
}: UploadAttachmentParams): Promise<UploadAttachmentResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('save_to_library', String(Boolean(saveToLibrary)));
  const res = await ChatApi.uploadAttachment(formData);
  return {
    attachmentId: res.attachment_id,
    filename: res.filename,
  };
};

export const createChatServices = (deps?: ChatServiceDeps): IChatService => ({
  getModels,
  getWorkspace: () =>
    deps ? getWorkspace(deps) : Promise.reject(createClientError(FRONTEND_CLIENT_ERROR.VALIDATION)),
  getChatInputAgents: () =>
    deps
      ? getChatInputAgents(deps)
      : Promise.reject(createClientError(FRONTEND_CLIENT_ERROR.VALIDATION)),
  getChatInputCapabilityOptions: (params) =>
    deps
      ? getChatInputCapabilityOptions(deps, params)
      : Promise.reject(createClientError(FRONTEND_CLIENT_ERROR.VALIDATION)),
  getDocumentPickerScopes: () =>
    deps
      ? getDocumentPickerScopes(deps)
      : Promise.reject(createClientError(FRONTEND_CLIENT_ERROR.VALIDATION)),
  listDocumentPickerChildren: (params) =>
    deps
      ? listDocumentPickerChildren(deps, params)
      : Promise.reject(createClientError(FRONTEND_CLIENT_ERROR.VALIDATION)),
  createSession,
  renameSession,
  deleteSession,
  listSessions,
  listHistoryMessages,
  getTools,
  uploadAttachment,
});
