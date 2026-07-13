import type { CustomBlockNoteEditor } from '../CustomBlockNote/blockNoteSchema';
import type { NoteContentPlugin } from '../CustomBlockNote/content/types';

export interface NoteSlashMenuProps {
  editor: CustomBlockNoteEditor;
  plugins: readonly NoteContentPlugin[];
}
