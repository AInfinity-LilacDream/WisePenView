import { create } from 'zustand';

import { registerStore } from '@/store/lifecycle';
import {
  DEFAULT_NOTE_RESOURCE_ASIDE_WIDTH,
  normalizeNoteResourceAsideWidth,
} from './noteResourceAsideConfig';

export type NoteResourceAsideMode = 'closed' | 'annotation' | 'discussion';

export const DEFAULT_NOTE_RESOURCE_ASIDE_MODE: NoteResourceAsideMode = 'closed';

interface NoteResourceAsideState {
  /** key 为笔记 resourceId。 */
  modeByResourceId: Record<string, NoteResourceAsideMode>;
  widthByResourceId: Record<string, number>;
  setMode: (resourceId: string, mode: NoteResourceAsideMode) => void;
  toggleMode: (resourceId: string, mode: Exclude<NoteResourceAsideMode, 'closed'>) => void;
  setWidth: (resourceId: string, width: number) => void;
  getWidth: (resourceId: string) => number;
}

export const useNoteResourceAsideStore = create<NoteResourceAsideState>((set, get) => ({
  modeByResourceId: {},
  widthByResourceId: {},
  setMode: (resourceId, mode) =>
    set((state) => {
      const currentMode = state.modeByResourceId[resourceId] ?? DEFAULT_NOTE_RESOURCE_ASIDE_MODE;
      if (currentMode === mode) return state;
      return {
        modeByResourceId: { ...state.modeByResourceId, [resourceId]: mode },
      };
    }),
  toggleMode: (resourceId, mode) => {
    const currentMode = get().modeByResourceId[resourceId] ?? DEFAULT_NOTE_RESOURCE_ASIDE_MODE;
    get().setMode(resourceId, currentMode === mode ? 'closed' : mode);
  },
  setWidth: (resourceId, width) => {
    const normalizedWidth = normalizeNoteResourceAsideWidth(width);
    set((state) => {
      if (
        (state.widthByResourceId[resourceId] ?? DEFAULT_NOTE_RESOURCE_ASIDE_WIDTH) ===
        normalizedWidth
      ) {
        return state;
      }
      return {
        widthByResourceId: { ...state.widthByResourceId, [resourceId]: normalizedWidth },
      };
    });
  },
  getWidth: (resourceId) =>
    get().widthByResourceId[resourceId] ?? DEFAULT_NOTE_RESOURCE_ASIDE_WIDTH,
}));

const resetNoteResourceAsideStore = (): void => {
  useNoteResourceAsideStore.setState({ modeByResourceId: {}, widthByResourceId: {} });
};

registerStore({
  id: 'note-ui.resource-aside',
  scope: 'tab',
  reset: resetNoteResourceAsideStore,
});
