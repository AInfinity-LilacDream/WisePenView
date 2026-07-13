import type {
  NoteAiContentPayload,
  NoteAiDiffAction,
  NoteAiDiffBlockMutation,
  NoteAiDiffBlockProjection,
} from '../../plugins/types';
import { hashStableValue, stableStringify } from './stableValue';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function hashNoteBlockForAiDiff(block: Record<string, unknown>): string {
  return hashStableValue({
    type: block.type,
    props: isRecord(block.props) ? block.props : {},
    content: block.content ?? null,
  });
}

export function resolveNoteAiDiffBlock(
  block: Record<string, unknown>,
  aiContent: NoteAiContentPayload
): NoteAiDiffBlockProjection | null {
  const operation = aiContent.operation;
  const candidate = aiContent.candidate;
  if ((operation === 'create' || operation === 'update') && !candidate) return null;
  if (operation === 'delete' && candidate !== null) return null;

  const candidateBlock = candidate
    ? {
        ...block,
        props: candidate.props,
        content: candidate.content,
      }
    : null;
  const current = operation === 'create' ? null : block;
  const next = operation === 'delete' ? null : candidateBlock;
  const hasSemanticChange =
    operation !== 'update' ||
    stableStringify({ props: block.props, content: block.content }) !==
      stableStringify({ props: next?.props, content: next?.content });
  if (!hasSemanticChange) return null;

  return {
    current,
    candidate: next,
    stale: hashNoteBlockForAiDiff(block) !== aiContent.baseHash,
  };
}

export function resolveNoteAiDiffBlockAction(
  aiContent: NoteAiContentPayload,
  action: NoteAiDiffAction,
  contentModel: 'inline' | 'table' | 'none'
): NoteAiDiffBlockMutation {
  if (action === 'discard') {
    return aiContent.operation === 'create' ? { kind: 'remove' } : { kind: 'none' };
  }
  if (aiContent.operation === 'delete') return { kind: 'remove' };
  if (!aiContent.candidate) return { kind: 'none' };
  return {
    kind: 'update',
    props: aiContent.candidate.props,
    ...(contentModel === 'none' ? {} : { content: aiContent.candidate.content }),
  };
}
