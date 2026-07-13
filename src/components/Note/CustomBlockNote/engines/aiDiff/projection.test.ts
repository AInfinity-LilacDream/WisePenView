import { describe, expect, it } from 'vitest';

import { hashNoteBlockForAiDiff, resolveNoteAiDiffBlock } from './projection';

const block = {
  id: 'block-1',
  type: 'paragraph',
  props: {},
  content: [{ type: 'text', text: '旧', styles: {} }],
  children: [],
};

describe('AI Diff block projection', () => {
  it('update 保留正文并生成 native candidate', () => {
    expect(
      resolveNoteAiDiffBlock(block, {
        revision: 'r1',
        baseHash: hashNoteBlockForAiDiff(block),
        operation: 'update',
        candidate: {
          props: {},
          content: [{ type: 'text', text: '新', styles: {} }],
        },
      })
    ).toEqual({
      current: block,
      candidate: { ...block, content: [{ type: 'text', text: '新', styles: {} }] },
      stale: false,
    });
  });

  it('create/delete 明确表达块级语义', () => {
    expect(
      resolveNoteAiDiffBlock(block, {
        revision: 'r-create',
        baseHash: hashNoteBlockForAiDiff(block),
        operation: 'create',
        candidate: { props: {}, content: [] },
      })
    ).toMatchObject({ current: null, candidate: { id: 'block-1' } });
    expect(
      resolveNoteAiDiffBlock(block, {
        revision: 'r-delete',
        baseHash: hashNoteBlockForAiDiff(block),
        operation: 'delete',
        candidate: null,
      })
    ).toEqual({ current: block, candidate: null, stale: false });
  });

  it('正文变化后标记 stale，candidate 不写入正文', () => {
    expect(
      resolveNoteAiDiffBlock(block, {
        revision: 'r1',
        baseHash: 'outdated',
        operation: 'update',
        candidate: { props: {}, content: [] },
      })?.stale
    ).toBe(true);
    expect(block.content).toEqual([{ type: 'text', text: '旧', styles: {} }]);
  });
});
