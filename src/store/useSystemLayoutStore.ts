import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandSessionStorage } from './sessionStorage';

interface SystemLayoutState {
  appSidebarWidth: number;
  adminSidebarWidth: number;
  workspaceLeftSidebarWidth: number;
  workspaceChatSessionPanelWidth: number;
  setAppSidebarWidth: (width: number) => void;
  setAdminSidebarWidth: (width: number) => void;
  setWorkspaceLeftSidebarWidth: (width: number) => void;
  setWorkspaceChatSessionPanelWidth: (width: number) => void;
}

const DEFAULT_SYSTEM_LAYOUT_STATE = {
  appSidebarWidth: 308,
  adminSidebarWidth: 308,
  workspaceLeftSidebarWidth: 308,
  workspaceChatSessionPanelWidth: 320,
};

const setWidth =
  <K extends keyof typeof DEFAULT_SYSTEM_LAYOUT_STATE>(key: K, width: number) =>
  (state: SystemLayoutState): Partial<SystemLayoutState> | SystemLayoutState => {
    if (state[key] === width) {
      return state;
    }
    return { [key]: width } as Pick<SystemLayoutState, K>;
  };

export const useSystemLayoutStore = create<SystemLayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_SYSTEM_LAYOUT_STATE,
      setAppSidebarWidth: (width) => set((state) => setWidth('appSidebarWidth', width)(state)),
      setAdminSidebarWidth: (width) => set((state) => setWidth('adminSidebarWidth', width)(state)),
      setWorkspaceLeftSidebarWidth: (width) =>
        set((state) => setWidth('workspaceLeftSidebarWidth', width)(state)),
      setWorkspaceChatSessionPanelWidth: (width) =>
        set((state) => setWidth('workspaceChatSessionPanelWidth', width)(state)),
    }),
    { name: 'system-layout', storage: zustandSessionStorage }
  )
);

export const clearSystemLayoutStore = (): void => {
  useSystemLayoutStore.setState(DEFAULT_SYSTEM_LAYOUT_STATE);
  useSystemLayoutStore.persist.clearStorage();
};
