import {
  resolveNoteAiDiffBlock,
  resolveNoteAiDiffBlockAction,
} from '../../engines/aiDiff/projection';
import { stableStringify } from '../../engines/aiDiff/stableValue';
import type { NoteBlockAiDiff, NoteInlineAiDiff, NotePluginRegistry } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readInlineProps(inline: Record<string, unknown>): Record<string, unknown> {
  return isRecord(inline.props) ? inline.props : inline;
}

function renderInlineChildren(content: unknown, registry: NotePluginRegistry): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (!Array.isArray(content)) return fragment;
  for (const inline of content) {
    if (!isRecord(inline) || typeof inline.type !== 'string') continue;
    const owner = registry.inlinePlugins.get(inline.type);
    if (!owner) throw new Error(`AI Diff 候选内容缺少 inline owner：${inline.type}`);
    fragment.appendChild(owner.aiDiff.renderCandidate(inline, registry));
  }
  return fragment;
}

function inlineContentEquals(
  current: unknown,
  candidate: unknown,
  registry: NotePluginRegistry
): boolean {
  if (!Array.isArray(current) || !Array.isArray(candidate)) return current === candidate;
  if (current.length !== candidate.length) return false;
  return current.every((inline, index) => {
    const next = candidate[index];
    if (!isRecord(inline) || !isRecord(next)) return false;
    const type = typeof inline.type === 'string' ? inline.type : '';
    if (type !== next.type) return false;
    return registry.inlinePlugins.get(type)?.aiDiff.equals(inline, next) ?? false;
  });
}

export const plainTextInlineAiDiff: NoteInlineAiDiff = {
  equals(current, candidate) {
    return stableStringify(current) === stableStringify(candidate);
  },
  renderCandidate(candidate) {
    const span = document.createElement('span');
    span.textContent = typeof candidate.text === 'string' ? candidate.text : '';
    return span;
  },
};

export const plainLinkInlineAiDiff: NoteInlineAiDiff = {
  equals(current, candidate) {
    return stableStringify(current) === stableStringify(candidate);
  },
  renderCandidate(candidate, registry) {
    const link = document.createElement('a');
    const props = readInlineProps(candidate);
    link.href = typeof candidate.href === 'string' ? candidate.href : String(props.href ?? '');
    link.target = '_blank';
    link.rel = 'noopener noreferrer nofollow';
    link.appendChild(renderInlineChildren(candidate.content, registry));
    return link;
  },
};

export const richTextBlockAiDiff: NoteBlockAiDiff = {
  resolve(block, aiContent, registry) {
    const projection = resolveNoteAiDiffBlock(block, aiContent);
    if (!projection?.current || !projection.candidate || aiContent.operation !== 'update') {
      return projection;
    }
    const propsEqual =
      stableStringify(projection.current.props) === stableStringify(projection.candidate.props);
    return propsEqual &&
      inlineContentEquals(projection.current.content, projection.candidate.content, registry)
      ? null
      : projection;
  },
  renderCandidate(candidate, registry) {
    const root = document.createElement('span');
    root.appendChild(renderInlineChildren(candidate.content, registry));
    return root;
  },
  apply(_block, aiContent, action) {
    return resolveNoteAiDiffBlockAction(aiContent, action, 'inline');
  },
};

export const atomicPropsBlockAiDiff: NoteBlockAiDiff = {
  resolve: resolveNoteAiDiffBlock,
  renderCandidate(candidate) {
    const root = document.createElement('span');
    const props = isRecord(candidate.props) ? candidate.props : {};
    const type = typeof candidate.type === 'string' ? candidate.type : '';
    const label = [props.name, props.caption, props.url, props.src].find(
      (value): value is string => typeof value === 'string' && value.length > 0
    );
    root.textContent = label ?? type;
    return root;
  },
  apply(_block, aiContent, action) {
    return resolveNoteAiDiffBlockAction(aiContent, action, 'none');
  },
};
