import { createContext, use } from 'react';

const NoteEditorReadOnlyContext = createContext(false);

export const NoteEditorReadOnlyProvider = NoteEditorReadOnlyContext.Provider;

export function useNoteEditorReadOnlyContext(): boolean {
  return use(NoteEditorReadOnlyContext);
}
