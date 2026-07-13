/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';

import { notePluginRegistry } from '..';
import { hashNoteBlockForAiDiff } from '../../engines/aiDiff/projection';

describe('DefaultContentPlugin AI Diff', () => {
  it('由 paragraph owner 解析 native candidate', () => {
    const block = {
      id: 'paragraph-1',
      type: 'paragraph',
      props: { textAlignment: 'left' },
      content: [{ type: 'text', text: '旧', styles: {} }],
      children: [],
    };
    const projection = notePluginRegistry.blockPlugins.get('paragraph')?.aiDiff?.resolve(
      block,
      {
        revision: 'r1',
        baseHash: hashNoteBlockForAiDiff(block),
        operation: 'update',
        candidate: {
          props: { textAlignment: 'left' },
          content: [{ type: 'text', text: '新', styles: {} }],
        },
      },
      notePluginRegistry
    );

    expect(projection).toEqual({
      current: block,
      candidate: { ...block, content: [{ type: 'text', text: '新', styles: {} }] },
      stale: false,
    });
  });

  it('富文本 block 委托 inline owner 渲染文本与链接候选', () => {
    const candidate = {
      type: 'paragraph',
      props: {},
      content: [
        { type: 'text', text: '访问 ', styles: {} },
        {
          type: 'link',
          href: '/docs',
          content: [{ type: 'text', text: '文档', styles: {} }],
        },
      ],
    };
    const preview = notePluginRegistry.blockPlugins
      .get('paragraph')
      ?.aiDiff?.renderCandidate(candidate, notePluginRegistry);

    expect(preview?.textContent).toBe('访问 文档');
    expect(preview?.querySelector('a')?.getAttribute('href')).toContain('/docs');
  });
});
