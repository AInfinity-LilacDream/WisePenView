import type { ChatFrontendState } from '@/domains/Chat';
import type { NoteSelectionSnapshot, NoteSessionStatus, SelectedNoteScope } from '@/domains/Note';
import {
  buildWorkspaceOpenResourceState,
  createWorkspaceChatProviderKey,
  type WorkspaceChatContext,
  type WorkspaceChatStateProvider,
  type WorkspaceOpenResourceChatState,
} from '@/layouts/Workspace/WorkspaceChatProtocol';
import { WORKSPACE_RESOURCE_TYPE, WORKSPACE_VIEWER } from '@/utils/navigation/workspaceRoute';

const NOTE_AI_DIFF_SKILL_ID = 'wisepen-note-ai-diff';
const NOTE_AI_DIFF_TOOL_NAMES = ['read_note_aixml', 'apply_current_note_ai_diff_plan'];

type NoteSelectedScopeStateValue =
  | {
      type: 'blocks';
      block_ids: string[];
      include_children?: boolean;
    }
  | {
      type: 'subtree';
      root_block_id: string;
    }
  | {
      type: 'block_range';
      start_block_id: string;
      end_block_id: string;
      include_partial?: boolean;
    };

type NoteClientStateVectorChatState = ChatFrontendState<'note_client_state_vector', string> & {
  disabled: true;
};

export type NoteChatFrontendState =
  | WorkspaceOpenResourceChatState
  | NoteClientStateVectorChatState
  | ChatFrontendState<'selected_text', string>
  | ChatFrontendState<'selected_note_scope', NoteSelectedScopeStateValue>;

function createNoteChatResource(resourceId: string) {
  return {
    resourceId,
    resourceType: WORKSPACE_RESOURCE_TYPE.NOTE,
    viewer: WORKSPACE_VIEWER.NOTE,
    editorType: 'note',
  } as const;
}

function mapSelectedNoteScope(scope: SelectedNoteScope): NoteSelectedScopeStateValue {
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

export function createNoteWorkspaceChatStateProvider(params: {
  resourceId: string;
  syncStatus: NoteSessionStatus;
  getClientStateVector: () => string | undefined;
}): WorkspaceChatStateProvider<NoteChatFrontendState> {
  const resource = createNoteChatResource(params.resourceId);

  return {
    key: createWorkspaceChatProviderKey(resource),
    getBlockedReason: () =>
      params.syncStatus === 'connected'
        ? undefined
        : '笔记仍在同步或已断开连接，请连接成功后再让 AI 读取当前笔记',
    getStates: () => {
      const stateVector = params.getClientStateVector();
      const states: NoteChatFrontendState[] = [
        buildWorkspaceOpenResourceState(resource),
        ...(stateVector
          ? [{ key: 'note_client_state_vector', value: stateVector, disabled: true } as const]
          : []),
      ];
      return states;
    },
    allowToolNames: NOTE_AI_DIFF_TOOL_NAMES,
    forceEnabledSkillIds: [NOTE_AI_DIFF_SKILL_ID],
  };
}

export function createNoteSelectionChatContext(
  resourceId: string,
  selection: NoteSelectionSnapshot
): WorkspaceChatContext<NoteChatFrontendState> {
  const resource = createNoteChatResource(resourceId);
  const selectedText = selection.text.trim();
  const states: NoteChatFrontendState[] = [
    { key: 'selected_text', value: selectedText },
    ...(selection.scope
      ? [{ key: 'selected_note_scope', value: mapSelectedNoteScope(selection.scope) } as const]
      : []),
  ];

  return {
    providerKey: createWorkspaceChatProviderKey(resource),
    preview: selectedText,
    states,
  };
}
