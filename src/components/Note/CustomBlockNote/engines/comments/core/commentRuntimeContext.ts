import { createContext, createElement, use, type ReactNode } from 'react';

import type { NoteCommentAnchor } from '../../../content/types';
import type { CustomBlockNoteEditor } from '../../../noteEditor';

export interface ContentCommentTarget {
  ownerId: string;
  anchor: NoteCommentAnchor;
}

export interface StartContentCommentOptions extends ContentCommentTarget {
  referenceText: string;
}

export interface UpdateContentCommentReferenceOptions extends ContentCommentTarget {
  referenceText: string;
  persist?: boolean;
}

export interface NoteCommentRuntimeContextValue {
  canComment: boolean;
  startContentComment: (options: StartContentCommentOptions) => void;
  updateContentCommentReference: (options: UpdateContentCommentReferenceOptions) => void;
  clearContentCommentReferenceOverride: (target: ContentCommentTarget) => void;
  selectedThreadId?: string;
  editor: CustomBlockNoteEditor;
  hasActiveContentComment: (target: ContentCommentTarget) => boolean;
  isContentThreadSelected: (target: ContentCommentTarget) => boolean;
  getThreadContentAnchor: (threadId: string) => ContentCommentTarget | undefined;
}

const NoteCommentRuntimeContext = createContext<NoteCommentRuntimeContextValue | null>(null);

export function NoteCommentRuntimeProvider({
  children,
  ...value
}: NoteCommentRuntimeContextValue & { children: ReactNode }) {
  return createElement(NoteCommentRuntimeContext.Provider, { value }, children);
}

export function useNoteCommentRuntime() {
  return use(NoteCommentRuntimeContext);
}
