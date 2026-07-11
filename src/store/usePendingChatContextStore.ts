import type { NoteSelectionSnapshot } from '@/domains/Note';
import { create } from 'zustand';

interface PendingChatContextState {
  pendingChatContextBySessionId: Record<string, NoteSelectionSnapshot>;
  setPendingChatContext: (sessionId: string, context: NoteSelectionSnapshot) => void;
  clearPendingChatContext: (sessionId: string) => void;
}

const DEFAULT_PENDING_CHAT_CONTEXT_STATE = {
  pendingChatContextBySessionId: {} as Record<string, NoteSelectionSnapshot>,
};

export const usePendingChatContextStore = create<PendingChatContextState>()((set) => ({
  ...DEFAULT_PENDING_CHAT_CONTEXT_STATE,
  setPendingChatContext: (sessionId, context) =>
    set((state) => ({
      pendingChatContextBySessionId: {
        ...state.pendingChatContextBySessionId,
        [sessionId]: context,
      },
    })),
  clearPendingChatContext: (sessionId) =>
    set((state) => {
      if (!state.pendingChatContextBySessionId[sessionId]) return state;
      const pendingChatContextBySessionId = { ...state.pendingChatContextBySessionId };
      delete pendingChatContextBySessionId[sessionId];
      return { pendingChatContextBySessionId };
    }),
}));

export function clearPendingChatContextStore(): void {
  usePendingChatContextStore.setState(DEFAULT_PENDING_CHAT_CONTEXT_STATE);
}
