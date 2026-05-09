import { create } from 'zustand';

type NoteSelectionState = {
  selectedTextByResourceId: Record<string, string>;
  enableSelectedTextByResourceId: Record<string, true>;
  setSelectedText: (resourceId: string, selectedText: string) => void;
  setEnableSelectedText: (resourceId: string, enabled: boolean) => void;
  clearSelectedText: (resourceId: string) => void;
};

const DEFAULT_NOTE_SELECTION_STATE = {
  selectedTextByResourceId: {} as Record<string, string>,
  enableSelectedTextByResourceId: {} as Record<string, true>,
};

export const useNoteSelectionStore = create<NoteSelectionState>()((set) => ({
  ...DEFAULT_NOTE_SELECTION_STATE,

  setSelectedText: (resourceId, selectedText) =>
    set((state) => {
      const nextText = selectedText;
      const isEnableSelectedText = Boolean(state.enableSelectedTextByResourceId[resourceId]);
      if (isEnableSelectedText && nextText.trim() === '') {
        return state;
      }
      if (state.selectedTextByResourceId[resourceId] === selectedText) {
        return state;
      }
      return {
        selectedTextByResourceId: {
          ...state.selectedTextByResourceId,
          [resourceId]: nextText,
        },
      };
    }),

  setEnableSelectedText: (resourceId, enabled) =>
    set((state) => {
      const isEnabled = Boolean(state.enableSelectedTextByResourceId[resourceId]);
      if (enabled === isEnabled) {
        return state;
      }
      const nextEnableSelectedTextByResourceId = { ...state.enableSelectedTextByResourceId };
      if (enabled) {
        nextEnableSelectedTextByResourceId[resourceId] = true;
      } else {
        delete nextEnableSelectedTextByResourceId[resourceId];
      }
      return {
        enableSelectedTextByResourceId: nextEnableSelectedTextByResourceId,
      };
    }),

  clearSelectedText: (resourceId) =>
    set((state) => {
      const hasSelectedText = state.selectedTextByResourceId[resourceId] != null;
      const hasEnableSelectedText = state.enableSelectedTextByResourceId[resourceId] != null;
      if (!hasSelectedText && !hasEnableSelectedText) {
        return state;
      }
      const nextSelectedTextByResourceId = { ...state.selectedTextByResourceId };
      delete nextSelectedTextByResourceId[resourceId];
      const nextEnableSelectedTextByResourceId = { ...state.enableSelectedTextByResourceId };
      delete nextEnableSelectedTextByResourceId[resourceId];
      return {
        selectedTextByResourceId: nextSelectedTextByResourceId,
        enableSelectedTextByResourceId: nextEnableSelectedTextByResourceId,
      };
    }),
}));

export const clearNoteSelectionStore = (): void => {
  useNoteSelectionStore.setState(DEFAULT_NOTE_SELECTION_STATE);
};
