import { registerStore } from '@/store/lifecycle';
import { create } from 'zustand';
import type { WorkspaceChatContext } from '../WorkspaceChatProtocol';

interface WorkspaceChatProtocolState {
  context?: WorkspaceChatContext;
  setContext: (context: WorkspaceChatContext) => void;
  clearContext: (context?: WorkspaceChatContext) => void;
}

const DEFAULT_STATE = {
  context: undefined,
};

export const useWorkspaceChatProtocolStore = create<WorkspaceChatProtocolState>()((set) => ({
  ...DEFAULT_STATE,
  setContext: (context) => set({ context }),
  clearContext: (context) =>
    set((state) => (context && state.context !== context ? state : DEFAULT_STATE)),
}));

const resetWorkspaceChatProtocolStore = (): void => {
  useWorkspaceChatProtocolStore.setState(DEFAULT_STATE);
};

registerStore({
  id: 'workspace.chat-protocol',
  scope: 'tab',
  reset: resetWorkspaceChatProtocolStore,
});
