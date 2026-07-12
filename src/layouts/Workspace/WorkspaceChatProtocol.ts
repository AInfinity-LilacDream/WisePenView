import type { ChatFrontendState } from '@/domains/Chat';

interface WorkspaceChatResource {
  resourceId: string;
  resourceType: string;
  viewer?: string;
  editorType?: string;
}

interface WorkspaceOpenResourceStateValue {
  resource_id: string;
  resource_type: string;
  viewer?: string;
  editor_type?: string;
}

export type WorkspaceOpenResourceChatState = ChatFrontendState<
  'workspace_open_resource',
  WorkspaceOpenResourceStateValue
>;

export interface WorkspaceChatStateProvider<State extends ChatFrontendState = ChatFrontendState> {
  key: string;
  getBlockedReason?: () => string | undefined;
  getStates: () => State[];
  allowToolNames?: readonly string[];
  forceEnabledSkillIds?: readonly string[];
}

export interface WorkspaceChatContext<State extends ChatFrontendState = ChatFrontendState> {
  providerKey: string;
  preview: string;
  states: State[];
}

export interface WorkspaceChatProtocolPort {
  provider?: WorkspaceChatStateProvider;
  context?: WorkspaceChatContext;
  clearContext: (context?: WorkspaceChatContext) => void;
}

export function createWorkspaceChatProviderKey(resource: WorkspaceChatResource): string {
  return [resource.resourceType, resource.resourceId, resource.viewer, resource.editorType]
    .filter(Boolean)
    .join(':');
}

export function buildWorkspaceOpenResourceState(
  resource: WorkspaceChatResource
): WorkspaceOpenResourceChatState {
  return {
    key: 'workspace_open_resource',
    value: {
      resource_id: resource.resourceId,
      resource_type: resource.resourceType,
      viewer: resource.viewer,
      editor_type: resource.editorType ?? resource.viewer,
    },
  };
}

export function createResourceWorkspaceChatStateProvider(
  resource: WorkspaceChatResource
): WorkspaceChatStateProvider {
  return {
    key: createWorkspaceChatProviderKey(resource),
    getStates: () => [buildWorkspaceOpenResourceState(resource)],
  };
}
