import { AI_DIFF_DISPLAY_MODE } from '@/domains/Note';
import type { NoteMarkdownExportProjection } from '../types';
import { applyAiDiffActionToProps } from './patch';

type AiDiffAction = 'accept' | 'discard';

function propsOf(node: Record<string, unknown>): Record<string, unknown> {
  return typeof node.props === 'object' && node.props !== null
    ? (node.props as Record<string, unknown>)
    : {};
}

function stringProp(props: Record<string, unknown>, key: string): string {
  return typeof props[key] === 'string' ? props[key] : '';
}

function textNode(text: string): Record<string, unknown> | null {
  return text ? { type: 'text', text, styles: {} } : null;
}

function modeToAction(mode: string): AiDiffAction | null {
  if (mode === AI_DIFF_DISPLAY_MODE.NEW_ONLY) return 'accept';
  if (mode === AI_DIFF_DISPLAY_MODE.OLD_ONLY) return 'discard';
  return null;
}

export function createAiDiffSyntaxMarkdownExport(type: string): NoteMarkdownExportProjection {
  return {
    project(node, context) {
      const action = modeToAction(context.aiDiffDisplayMode);
      if (!action) return node;
      const props = propsOf(node);

      if (type === 'ai-diff') {
        return textNode(stringProp(props, action === 'accept' ? 'replace' : 'origin'));
      }
      if (type === 'ai-add') {
        return action === 'accept' ? textNode(stringProp(props, 'text')) : null;
      }
      if (type === 'ai-delete') {
        return action === 'discard' ? textNode(stringProp(props, 'text')) : null;
      }
      if (type === 'ai-link-add') {
        if (action === 'discard') return null;
      } else if (type === 'ai-link-delete') {
        if (action === 'accept') return null;
      }
      const text = stringProp(props, 'text');
      const href = stringProp(props, 'href');
      return text || href
        ? {
            type: 'link',
            href,
            content: text ? [{ type: 'text', text, styles: {} }] : [],
          }
        : null;
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
