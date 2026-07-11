export type SelectedNoteScope =
  | {
      type: 'blocks';
      blockIds: string[];
      includeChildren?: boolean;
    }
  | {
      type: 'subtree';
      rootBlockId: string;
    }
  | {
      type: 'blockRange';
      startBlockId: string;
      endBlockId: string;
      includePartial?: boolean;
    };

export interface NoteSelectionSnapshot {
  text: string;
  scope: SelectedNoteScope | null;
}
