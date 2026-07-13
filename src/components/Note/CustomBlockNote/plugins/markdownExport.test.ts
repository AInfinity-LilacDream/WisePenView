import { describe, expect, it } from 'vitest';

import { AI_DIFF_DISPLAY_MODE } from '@/domains/Note';
import { notePluginRegistry } from '.';
import { projectNoteBlocksForMarkdown } from './markdownExport';

describe('projectNoteBlocksForMarkdown', () => {
  it('由 inline owner 投影 AI Diff 的旧文本并保留链接', () => {
    const blocks = [
      {
        id: 'paragraph',
        type: 'paragraph',
        props: {},
        content: [
          { type: 'text', text: 'A', styles: {} },
          { type: 'ai-diff', props: { origin: '旧', replace: '新' } },
          { type: 'ai-add', props: { text: '增加' } },
          { type: 'ai-link-delete', props: { text: '链接', href: '/old' } },
        ],
        children: [],
      },
    ];

    expect(projectNoteBlocksForMarkdown(blocks, notePluginRegistry)).toEqual([
      {
        id: 'paragraph',
        type: 'paragraph',
        props: {},
        content: [
          { type: 'text', text: 'A', styles: {} },
          { type: 'text', text: '旧', styles: {} },
          {
            type: 'link',
            href: '/old',
            content: [{ type: 'text', text: '链接', styles: {} }],
          },
        ],
        children: [],
      },
    ]);
  });

  it('递归投影新文本、公式和嵌套块', () => {
    const blocks = [
      {
        id: 'math',
        type: 'math',
        props: {
          expression: 'new',
          aiDiffType: 'edit',
          aiDiffOrigin: 'old',
          aiDiffReplace: 'new',
        },
        children: [
          {
            id: 'child',
            type: 'paragraph',
            props: {},
            content: [
              {
                type: 'inlineMath',
                props: {
                  expression: 'y',
                  aiDiffType: 'delete',
                  aiDiffOrigin: 'x',
                  aiDiffReplace: '',
                },
              },
              { type: 'ai-link-add', props: { text: '新链接', href: '/new' } },
            ],
            children: [],
          },
        ],
      },
    ];

    expect(
      projectNoteBlocksForMarkdown(blocks, notePluginRegistry, AI_DIFF_DISPLAY_MODE.NEW_ONLY)
    ).toEqual([
      {
        id: 'math',
        type: 'math',
        props: {
          expression: 'new',
          aiDiffType: '',
          aiDiffOrigin: '',
          aiDiffReplace: '',
          aiDiffKey: '',
        },
        children: [
          {
            id: 'child',
            type: 'paragraph',
            props: {},
            content: [
              {
                type: 'link',
                href: '/new',
                content: [{ type: 'text', text: '新链接', styles: {} }],
              },
            ],
            children: [],
          },
        ],
      },
    ]);
  });

  it('在 diff 内容全部隐藏且无子块时移除空块', () => {
    const blocks = [
      {
        id: 'created',
        type: 'paragraph',
        props: {},
        content: [{ type: 'ai-add', props: { text: '只存在于新文本' } }],
        children: [],
      },
    ];

    expect(projectNoteBlocksForMarkdown(blocks, notePluginRegistry)).toEqual([]);
  });
});
