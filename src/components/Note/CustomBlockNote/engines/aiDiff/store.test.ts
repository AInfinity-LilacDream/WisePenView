import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

import type { NoteAiContentPayload } from '../../content/types';
import {
  clearBlockAiContent,
  observeAiContent,
  readAllAiContent,
  readBlockAiContent,
  replaceBlockAiContent,
  setBlockAiContent,
} from './store';

const payload: NoteAiContentPayload = {
  revision: 'r1',
  baseHash: 'base-1',
  operation: 'update',
  candidate: { props: {}, content: [] },
};

describe('AI-content sidecar store', () => {
  it('无 key 时逻辑字段为 null，并忽略非法 payload', () => {
    const doc = new Y.Doc();
    expect(readBlockAiContent(doc, 'missing')).toBeNull();
    doc.getMap('ai-content-store').set('invalid', { revision: 'r1' });
    expect(readAllAiContent(doc).size).toBe(0);
  });

  it('按 revision 替换和清理候选', () => {
    const doc = new Y.Doc();
    setBlockAiContent(doc, 'block-1', payload);
    expect(readBlockAiContent(doc, 'block-1')).toEqual(payload);
    expect(replaceBlockAiContent(doc, 'block-1', 'old', { ...payload, revision: 'r2' })).toBe(
      'stale'
    );
    expect(replaceBlockAiContent(doc, 'block-1', 'r1', { ...payload, revision: 'r2' })).toBe(
      'applied'
    );
    expect(clearBlockAiContent(doc, 'block-1', 'r1')).toBe('stale');
    expect(clearBlockAiContent(doc, 'block-1', 'r2')).toBe('applied');
    expect(readBlockAiContent(doc, 'block-1')).toBeNull();
  });

  it('独立观察 sidecar 变化', () => {
    const doc = new Y.Doc();
    const listener = vi.fn();
    const unobserve = observeAiContent(doc, listener);
    setBlockAiContent(doc, 'block-1', payload);
    expect(listener).toHaveBeenCalledTimes(1);
    unobserve();
    setBlockAiContent(doc, 'block-2', payload);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
