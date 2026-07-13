import type { NoteCommentsStatus } from '../../../index.type';

export interface NoteCommentsRuntimePolicy {
  enabled: boolean;
  uiEnabled: boolean;
  authorizable: boolean;
  writable: boolean;
}

export function resolveNoteCommentsRuntimePolicy(
  status: NoteCommentsStatus
): NoteCommentsRuntimePolicy {
  if (status.kind === 'disabled') {
    return { enabled: false, uiEnabled: false, authorizable: false, writable: false };
  }
  if (status.kind === 'connecting') {
    return {
      enabled: true,
      uiEnabled: false,
      authorizable: status.authorizable,
      writable: false,
    };
  }
  if (status.kind === 'readOnly') {
    return { enabled: true, uiEnabled: true, authorizable: false, writable: false };
  }
  return { enabled: true, uiEnabled: true, authorizable: true, writable: true };
}
