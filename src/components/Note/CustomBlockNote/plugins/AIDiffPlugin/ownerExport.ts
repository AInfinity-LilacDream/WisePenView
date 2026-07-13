import { AI_DIFF_DISPLAY_MODE } from '@/domains/Note';
import type { NoteMarkdownExportProjection } from '../types';
import { createSyntaxInlineAiDiff } from './ownerPresence';
import { applyAiDiffActionToProps } from './patch';

type AiDiffAction = 'accept' | 'discard';

function modeToAction(mode: string): AiDiffAction | null {
  if (mode === AI_DIFF_DISPLAY_MODE.NEW_ONLY) return 'accept';
  if (mode === AI_DIFF_DISPLAY_MODE.OLD_ONLY) return 'discard';
  return null;
}

export function createAiDiffSyntaxMarkdownExport(type: string): NoteMarkdownExportProjection {
  const aiDiff = createSyntaxInlineAiDiff(type);
  return {
    project(node, context) {
      const action = modeToAction(context.aiDiffDisplayMode);
      if (!action) return node;
      return aiDiff.apply(node, action)?.[0] ?? null;
    },
  };
}

export const atomicAiDiffMarkdownExport: NoteMarkdownExportProjection = {
  project(node, context) {
    const action = modeToAction(context.aiDiffDisplayMode);
    if (!action) return node;
    const result = applyAiDiffActionToProps(node.props, action);
    if (result.kind === 'remove') return null;
    if (result.kind === 'update') return { ...node, props: result.props };
    return node;
  },
};
