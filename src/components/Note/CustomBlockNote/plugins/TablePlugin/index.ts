import { defaultBlockSpecs } from '@blocknote/core';
import { PanelLeft, PanelTop, StretchHorizontal, Table2 } from 'lucide-react';

import {
  resolveNoteAiDiffBlock,
  resolveNoteAiDiffBlockAction,
} from '../../engines/aiDiff/projection';
import type { NoteBlockPlugin, NotePluginRegistry, NoteSideMenuAction } from '../types';

interface TableContentLike {
  rows: Array<{ cells: unknown[] }>;
  columnWidths: Array<number | undefined>;
  headerRows?: number;
  headerCols?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readTableContent(block: Record<string, unknown>): TableContentLike | null {
  if (!isRecord(block.content)) return null;
  const content = block.content;
  if (!Array.isArray(content.rows) || !Array.isArray(content.columnWidths)) return null;
  return content as unknown as TableContentLike;
}

function tableActions(content: TableContentLike | null): NoteSideMenuAction[] {
  return [
    ...(content
      ? [
          {
            id: 'header-row',
            label: '标题行',
            icon: PanelTop,
            kind: 'toggle' as const,
            selected: Boolean(content.headerRows),
          },
          {
            id: 'header-column',
            label: '标题列',
            icon: PanelLeft,
            kind: 'toggle' as const,
            selected: Boolean(content.headerCols),
          },
        ]
      : []),
    {
      id: 'reset-column-widths',
      label: '均分列宽',
      icon: StretchHorizontal,
      kind: 'command',
    },
  ];
}

function renderTableCell(cell: unknown, registry: NotePluginRegistry) {
  const td = document.createElement('td');
  const content = Array.isArray(cell)
    ? cell
    : isRecord(cell) && Array.isArray(cell.content)
      ? cell.content
      : [];
  for (const inline of content) {
    if (!isRecord(inline) || typeof inline.type !== 'string') continue;
    const owner = registry.inlinePlugins.get(inline.type);
    if (owner) td.appendChild(owner.aiDiff.renderCandidate(inline, registry));
  }
  return td;
}

export const tablePlugin = {
  kind: 'block',
  id: 'table',
  type: 'table',
  contentModel: 'table',
  spec: defaultBlockSpecs.table,
  capabilities: {
    markdownImport: { support: 'default' },
    markdownExport: { support: 'default' },
    aiDiff: { support: 'custom' },
    projection: { support: 'custom' },
    print: { support: 'custom' },
  },
  comments: { documentThreads: 'unsupported' },
  aiDiff: {
    resolve: resolveNoteAiDiffBlock,
    renderCandidate(candidate, registry) {
      const table = document.createElement('table');
      const content = readTableContent(candidate);
      for (const row of content?.rows ?? []) {
        const tr = document.createElement('tr');
        row.cells.forEach((cell) => tr.appendChild(renderTableCell(cell, registry)));
        table.appendChild(tr);
      }
      return table;
    },
    apply(_block, aiContent, action) {
      return resolveNoteAiDiffBlockAction(aiContent, action, 'table');
    },
  },
  print: {
    styles: [
      `.note-print-body .bn-block-content[data-content-type='table'],
.note-print-body table {
  break-inside: avoid-page;
  page-break-inside: avoid;
}
.note-print-body table {
  max-width: 100% !important;
}`,
    ],
  },
  projection: { plainText: () => '' },
  sideMenu: {
    icon: Table2,
    inspect(block) {
      return { variant: 'structured', actions: tableActions(readTableContent(block)) };
    },
    apply(block, actionId) {
      const content = readTableContent(block);
      if (!content) return null;
      if (actionId === 'header-row') {
        return {
          type: 'table',
          content: { ...content, headerRows: content.headerRows ? undefined : 1 },
        };
      }
      if (actionId === 'header-column') {
        return {
          type: 'table',
          content: { ...content, headerCols: content.headerCols ? undefined : 1 },
        };
      }
      if (actionId === 'reset-column-widths') {
        const columnCount = content.columnWidths.length || content.rows[0]?.cells.length || 0;
        return {
          type: 'table',
          content: {
            ...content,
            columnWidths: Array.from({ length: columnCount }, () => undefined),
          },
        };
      }
      return null;
    },
  },
} satisfies NoteBlockPlugin;
