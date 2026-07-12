import { create } from 'zustand';

import { registerStore } from '@/store/lifecycle';

interface ResourceDisplayNameState {
  /** resourceId → 重命名接口成功后的最新展示名 */
  byResourceId: Record<string, string>;
  setDisplayName: (resourceId: string, resourceName: string) => void;
}

export const useResourceDisplayNameStore = create<ResourceDisplayNameState>()((set) => ({
  byResourceId: {},

  setDisplayName: (resourceId, resourceName) =>
    set((state) => ({
      byResourceId: { ...state.byResourceId, [resourceId]: resourceName },
    })),
}));

const resetResourceDisplayNameStore = (): void => {
  useResourceDisplayNameStore.setState({ byResourceId: {} });
};

registerStore({
  id: 'resource.display-name',
  scope: 'session',
  reset: resetResourceDisplayNameStore,
});
