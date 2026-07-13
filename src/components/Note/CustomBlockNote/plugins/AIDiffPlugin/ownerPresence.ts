import { AI_DIFF_DISPLAY_MODE } from '@/domains/Note';
import type { NoteInlineAiDiff } from '../types';
import { applyAiDiffActionToProps, hasAtomicAiDiff, resolveAiInlineReplacement } from './patch';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readProps(content: Record<string, unknown>): Record<string, unknown> {
  const props = content.props;
  return isRecord(props) ? props : content;
}

function stringProp(content: Record<string, unknown>, key: string): string {
  const value = readProps(content)[key];
  return typeof value === 'string' ? value : '';
}

export const plainTextInlineAiDiff: NoteInlineAiDiff = {
  isPresent: () => false,
  isVisible: (inline) => typeof inline.text === 'string' && inline.text.trim() !== '',
  apply: () => undefined,
};

export const plainLinkInlineAiDiff: NoteInlineAiDiff = {
  isPresent: () => false,
  isVisible: () => true,
  apply: () => undefined,
};

export const atomicInlineAiDiff: NoteInlineAiDiff = {
  isPresent: hasAtomicAiDiff,
  isVisible(inline, mode) {
    const expression = stringProp(inline, 'expression');
    const aiDiffType = stringProp(inline, 'aiDiffType');
    const origin = stringProp(inline, 'aiDiffOrigin');
    const replace = stringProp(inline, 'aiDiffReplace');
    if (aiDiffType === 'edit') {
      if (mode === AI_DIFF_DISPLAY_MODE.OLD_ONLY) return origin !== '';
      if (mode === AI_DIFF_DISPLAY_MODE.NEW_ONLY) return replace !== '';
      return origin !== '' || replace !== '';
    }
    if (aiDiffType === 'create') {
      return mode !== AI_DIFF_DISPLAY_MODE.OLD_ONLY && replace !== '';
    }
    if (aiDiffType === 'delete') {
      return mode !== AI_DIFF_DISPLAY_MODE.NEW_ONLY && origin !== '';
    }
    return expression !== '';
  },
  apply(inline, action) {
    const result = applyAiDiffActionToProps(readProps(inline), action);
    if (result.kind === 'none') return undefined;
    if (result.kind === 'remove') return [];
    return [{ ...inline, props: result.props }];
  },
};

export function createSyntaxInlineAiDiff(type: string): NoteInlineAiDiff {
  return {
    isPresent: () => true,
    isVisible(inline, mode) {
      const action = mode === AI_DIFF_DISPLAY_MODE.NEW_ONLY ? 'accept' : 'discard';
      if (mode === AI_DIFF_DISPLAY_MODE.COMPARE) {
        return type === 'ai-diff'
          ? Boolean(stringProp(inline, 'origin') || stringProp(inline, 'replace'))
          : Boolean(stringProp(inline, 'text'));
      }
      return resolveAiInlineReplacement(type, readProps(inline), action).length > 0;
    },
    apply(inline, action) {
      return resolveAiInlineReplacement(type, readProps(inline), action) as Record<
        string,
        unknown
      >[];
    },
  };
}
