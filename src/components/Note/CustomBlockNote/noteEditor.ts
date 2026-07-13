import {
  collectNoteEditorExtensions,
  collectNoteEditorProps,
  createDefaultNoteBlock,
  createNoteBlockNoteSchema,
  createNotePluginRegistry,
  createNoteReadOnlyFilterExtension,
} from './content/registry';
import type { NotePluginBundle } from './content/types';
import { aiDiffRuntimeExtension } from './engines/aiDiff/runtime';
import { editorRuntimeExtension } from './engines/editor/stripEscape';
import { codeBlockPlugin } from './plugins/CodeBlockPlugin';
import { defaultContentPlugin } from './plugins/DefaultContentPlugin';
import { latexPlugin } from './plugins/LatexPlugin';
import { tablePlugin } from './plugins/TablePlugin';

const notePluginTree = {
  kind: 'bundle',
  id: 'note',
  children: [defaultContentPlugin, codeBlockPlugin, tablePlugin, latexPlugin],
} satisfies NotePluginBundle;

export const notePluginRegistry = createNotePluginRegistry(notePluginTree, [
  editorRuntimeExtension,
  aiDiffRuntimeExtension,
]);

export {
  collectNoteEditorExtensions,
  collectNoteEditorProps,
  createDefaultNoteBlock,
  createNoteBlockNoteSchema,
  createNoteReadOnlyFilterExtension,
};
