import type { NoteSelectionSnapshot, SelectedNoteScope } from '@/domains/Note';
import { registerStore } from '@/store/lifecycle';
import { create } from 'zustand';

interface NoteEditorSelectionState {
  currentSelectionByResourceId: Record<string, NoteSelectionSnapshot>;
  setCurrentSelection: (resourceId: string, text: string, scope: SelectedNoteScope | null) => void;
  clearCurrentSelection: (resourceId: string) => void;
}

const DEFAULT_NOTE_EDITOR_SELECTION_STATE = {
  currentSelectionByResourceId: {} as Record<string, NoteSelectionSnapshot>,
};

export const useNoteEditorSelectionStore = create<NoteEditorSelectionState>()((set) => ({
  ...DEFAULT_NOTE_EDITOR_SELECTION_STATE,
  setCurrentSelection: (resourceId, text, scope) =>
    set((state) => ({
      currentSelectionByResourceId: {
        ...state.currentSelectionByResourceId,
        [resourceId]: { text, scope },
      },
    })),
  clearCurrentSelection: (resourceId) =>
    set((state) => {
      if (!state.currentSelectionByResourceId[resourceId]) return state;
      const currentSelectionByResourceId = { ...state.currentSelectionByResourceId };
      delete currentSelectionByResourceId[resourceId];
      return { currentSelectionByResourceId };
    }),
}));

function resetNoteEditorSelectionStore(): void {
  useNoteEditorSelectionStore.setState(DEFAULT_NOTE_EDITOR_SELECTION_STATE);
}

registerStore({
  id: 'note-ui.editor-selection',
  scope: 'tab',
  reset: resetNoteEditorSelectionStore,
});
