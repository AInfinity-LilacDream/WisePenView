import type { NoteBlockAiDiff, NoteInlineAiDiff } from '../../content/types';
import {
  resolveNoteAiDiffBlock,
  resolveNoteAiDiffBlockAction,
} from '../../engines/aiDiff/projection';
import { stableStringify } from '../../engines/aiDiff/stableValue';
import { renderKatexInto } from './katexRender';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readExpression(value: Record<string, unknown>): string {
  const props = isRecord(value.props) ? value.props : value;
  return typeof props.expression === 'string' ? props.expression : '';
}

export const inlineMathAiDiff: NoteInlineAiDiff = {
  equals(current, candidate) {
    return stableStringify(current) === stableStringify(candidate);
  },
  renderCandidate(candidate) {
    const root = document.createElement('span');
    renderKatexInto(root, readExpression(candidate), '', false);
    return root;
  },
};

export const mathBlockAiDiff: NoteBlockAiDiff = {
  resolve: resolveNoteAiDiffBlock,
  renderCandidate(candidate) {
    const root = document.createElement('div');
    renderKatexInto(root, readExpression(candidate), '', true);
    return root;
  },
  apply(_block, aiContent, action) {
    return resolveNoteAiDiffBlockAction(aiContent, action, 'none');
  },
};
