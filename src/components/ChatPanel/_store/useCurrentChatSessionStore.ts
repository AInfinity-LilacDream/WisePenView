import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { registerStore } from '@/store/lifecycle';
import { createStoreJSONStorage } from '@/store/persistence';

interface CurrentChatSessionState {
  currentSessionId?: string;
  currentSessionTitle?: string;
  setCurrentSession: (session: { id: string; title: string }) => void;
  clearCurrentSession: () => void;
}

const DEFAULT_CURRENT_CHAT_SESSION_STATE: Pick<
  CurrentChatSessionState,
  'currentSessionId' | 'currentSessionTitle'
> = {
  currentSessionId: undefined,
  currentSessionTitle: undefined,
};

export const useCurrentChatSessionStore = create<CurrentChatSessionState>()(
  persist(
    (set) => ({
      ...DEFAULT_CURRENT_CHAT_SESSION_STATE,
      setCurrentSession: ({ id, title }) => {
        set((state) => {
          if (state.currentSessionId === id && state.currentSessionTitle === title) {
            return state;
          }
          return {
            currentSessionId: id,
            currentSessionTitle: title,
          };
        });
      },
      clearCurrentSession: () =>
        set((state) => {
          if (state.currentSessionId == null && state.currentSessionTitle == null) {
            return state;
          }
          return DEFAULT_CURRENT_CHAT_SESSION_STATE;
        }),
    }),
    { name: 'current-chat-session', storage: createStoreJSONStorage('tab') }
  )
);

const resetCurrentChatSessionStore = (): void => {
  useCurrentChatSessionStore.setState(DEFAULT_CURRENT_CHAT_SESSION_STATE);
};

registerStore({
  id: 'chat-panel.current-session',
  scope: 'tab',
  reset: resetCurrentChatSessionStore,
});
