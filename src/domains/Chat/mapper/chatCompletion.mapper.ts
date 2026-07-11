import type { SelectedNoteScope } from '@/domains/Note/entity/noteSelection';

import type {
  ChatCompletionRequest,
  ChatFrontendState,
  SendSessionMessageOptions,
} from '../session/index.type';

const NOTE_AI_DIFF_SKILL_ID = 'wisepen-note-ai-diff';
const NOTE_AI_DIFF_TOOL_NAMES = ['read_note_aixml', 'apply_current_note_ai_diff_plan'] as const;

function mapSelectedNoteScope(scope: SelectedNoteScope): Record<string, unknown> {
  if (scope.type === 'blocks') {
    return {
      type: 'blocks',
      block_ids: scope.blockIds,
      ...(scope.includeChildren === undefined ? {} : { include_children: scope.includeChildren }),
    };
  }
  if (scope.type === 'subtree') {
    return { type: 'subtree', root_block_id: scope.rootBlockId };
  }
  return {
    type: 'block_range',
    start_block_id: scope.startBlockId,
    end_block_id: scope.endBlockId,
    ...(scope.includePartial === undefined ? {} : { include_partial: scope.includePartial }),
  };
}

function buildFrontendStates(options: SendSessionMessageOptions): ChatFrontendState[] {
  const frontendStates: ChatFrontendState[] = [];
  const selectedText = options.selectedText?.trim();

  if (selectedText) {
    frontendStates.push({ key: 'selected_text', value: selectedText });
  }
  if (options.selectedNoteScope) {
    frontendStates.push({
      key: 'selected_note_scope',
      value: mapSelectedNoteScope(options.selectedNoteScope),
    });
  }

  const workspaceContext = options.workspaceContext;
  if (workspaceContext?.resourceId) {
    frontendStates.push({
      key: 'workspace_open_resource',
      value: {
        resource_id: workspaceContext.resourceId,
        resource_type: workspaceContext.resourceType,
        viewer: workspaceContext.viewer,
        editor_type: workspaceContext.editorType ?? workspaceContext.viewer,
      },
    });

    const stateVector =
      workspaceContext.editorType === 'note'
        ? workspaceContext.getNoteClientStateVector?.()
        : undefined;
    if (stateVector) {
      frontendStates.push({ key: 'note_client_state_vector', value: stateVector, disabled: true });
    }
  }

  const activeResources = (options.selectedResources ?? []).filter((resource) => resource.enabled);
  if (activeResources.length > 0) {
    frontendStates.push({
      key: 'selected_resources',
      value: activeResources.map((resource) => ({
        resource_id: resource.resourceId,
        resource_name: resource.resourceName,
        resource_type: resource.resourceType,
      })),
    });
  }
  return frontendStates;
}

function mergeUnique(first?: readonly string[], second?: readonly string[]): string[] {
  return Array.from(new Set([...(first ?? []), ...(second ?? [])]));
}

export function mapChatCompletionRequest(params: {
  defaultSessionId: string;
  defaultModel?: string;
  query: string;
  options?: SendSessionMessageOptions;
}): ChatCompletionRequest {
  const { defaultSessionId, defaultModel, query, options = {} } = params;
  const resolvedModel = options.model ?? defaultModel;
  const frontendStates = buildFrontendStates(options);
  const attachmentIds = (options.uploadedAttachments ?? [])
    .filter((attachment) => attachment.enabled)
    .map((attachment) => attachment.attachmentId);
  const isNoteWorkspace = options.workspaceContext?.editorType === 'note';
  const allowToolNames = mergeUnique(
    options.allowToolNames,
    isNoteWorkspace ? NOTE_AI_DIFF_TOOL_NAMES : undefined
  );
  const forceEnabledSkillIds = mergeUnique(
    options.forceEnabledSkillIds,
    isNoteWorkspace ? [NOTE_AI_DIFF_SKILL_ID] : undefined
  );

  return {
    session_id: options.sessionId ?? defaultSessionId,
    query,
    ...(resolvedModel ? { model: resolvedModel } : {}),
    ...(options.providerId ? { provider_id: options.providerId } : {}),
    ...(options.runtimeOptions ? { runtime_options: options.runtimeOptions } : {}),
    ...(frontendStates.length > 0 ? { frontend_states: frontendStates } : {}),
    ...(attachmentIds.length > 0 ? { user_defined_attachment_ids: attachmentIds } : {}),
    ...(allowToolNames.length > 0 ? { user_defined_allow_tool_names: allowToolNames } : {}),
    ...(options.denyToolNames?.length
      ? { user_defined_deny_tool_names: options.denyToolNames }
      : {}),
    ...(options.onDemandSkillIds?.length
      ? { user_defined_on_demand_skill_ids: options.onDemandSkillIds }
      : {}),
    ...(forceEnabledSkillIds.length > 0
      ? { user_defined_force_enabled_skill_ids: forceEnabledSkillIds }
      : {}),
  };
}
