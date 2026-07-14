import { projectInlinePlainText } from '../../content/projection';
import type {
  NoteAiDiffComparisonContext,
  NoteBlockAiDiff,
  NoteInlineAiDiff,
  NotePluginRegistry,
} from '../../content/types';
import styles from '../../engines/aiDiff/style.module.less';
import type { AiDiffTextRenderPlan } from '../../engines/aiDiff/textDiffStrategy';
import type { AiDiffTextSegment } from '../../engines/aiDiff/wordDiff';
import { paragraphAiDiffRenderStrategy } from './aiDiffStrategy';
import {
  acceptInlineTextHunk,
  discardInlineTextHunk,
  sliceInlineContentByTextRange,
} from './inlineDiff';

const BOOLEAN_STYLE_TAGS = [
  ['bold', 'strong'],
  ['italic', 'em'],
  ['underline', 'u'],
  ['strike', 's'],
  ['code', 'code'],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readInlineProps(inline: Record<string, unknown>): Record<string, unknown> {
  return isRecord(inline.props) ? inline.props : inline;
}

function readInlineStyles(inline: Record<string, unknown>): Record<string, unknown> {
  return isRecord(inline.styles) ? inline.styles : {};
}

function applyColorStyle(
  element: HTMLElement,
  attribute: 'backgroundColor' | 'textColor',
  value: unknown
): void {
  if (typeof value !== 'string' || !value || value === 'default') return;
  element.dataset[attribute] = value;
}

function renderStyledText(text: string, inline: Record<string, unknown>): HTMLElement {
  const root = document.createElement('span');
  root.className = styles.styledText;
  const inlineStyles = readInlineStyles(inline);
  applyColorStyle(root, 'textColor', inlineStyles.textColor);
  applyColorStyle(root, 'backgroundColor', inlineStyles.backgroundColor);

  let contentRoot = root;
  for (const [style, tag] of BOOLEAN_STYLE_TAGS) {
    if (inlineStyles[style] !== true) continue;
    const styleRoot = document.createElement(tag);
    contentRoot.appendChild(styleRoot);
    contentRoot = styleRoot;
  }
  contentRoot.textContent = text;
  return root;
}

function renderInlineChildren(content: unknown, registry: NotePluginRegistry): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (!Array.isArray(content)) return fragment;
  for (const inline of content) {
    if (!isRecord(inline) || typeof inline.type !== 'string') continue;
    const owner = registry.inlinePlugins.get(inline.type);
    if (!owner) throw new Error(`AI Diff 候选内容缺少 inline owner：${inline.type}`);
    fragment.appendChild(owner.aiDiff.renderAiContent(inline, registry));
  }
  return fragment;
}

function renderInlineRange(
  content: unknown,
  from: number,
  to: number,
  registry: NotePluginRegistry
): DocumentFragment {
  const slicedContent = sliceInlineContentByTextRange(content, from, to, registry);
  if (!slicedContent) {
    throw new Error(`AI Diff 无法按文本范围渲染 inline content：${from}-${to}`);
  }
  return renderInlineChildren(slicedContent, registry);
}

function renderComparisonSegment(params: {
  segment: AiDiffTextSegment;
  originContent: unknown;
  replacementContent: unknown;
  originOffset: number;
  replacementOffset: number;
  registry: NotePluginRegistry;
}): { element: HTMLElement; originOffset: number; replacementOffset: number } {
  const { segment, originContent, replacementContent, originOffset, replacementOffset, registry } =
    params;
  const element = document.createElement('span');
  const isDelete = segment.kind === 'delete';
  const from = isDelete ? originOffset : replacementOffset;
  const source = isDelete ? originContent : replacementContent;
  element.appendChild(renderInlineRange(source, from, from + segment.text.length, registry));
  element.dataset.aiDiffWordRole = segment.kind;
  if (segment.kind === 'delete') element.className = styles.inlineDelete;
  if (segment.kind === 'insert') element.className = styles.inlineAdd;

  return {
    element,
    originOffset: segment.kind === 'insert' ? originOffset : originOffset + segment.text.length,
    replacementOffset:
      segment.kind === 'delete' ? replacementOffset : replacementOffset + segment.text.length,
  };
}

function resolveRichTextRenderPlan(
  current: Record<string, unknown>,
  aiBlock: Record<string, unknown>,
  registry: NotePluginRegistry
): AiDiffTextRenderPlan {
  const plan = paragraphAiDiffRenderStrategy.plan(
    projectInlinePlainText(current.content, registry),
    projectInlinePlainText(aiBlock.content, registry)
  );
  if (plan.mode === 'block') return plan;
  if (current.type !== 'paragraph') {
    return {
      mode: 'block',
      origin: plan.origin,
      replacement: plan.replacement,
      reason: 'unsupported-inline-structure',
      metrics: plan.metrics,
    };
  }
  const isFullyActionable = plan.hunks
    .filter((hunk) => hunk.mode === 'hunk')
    .every(
      (hunk) =>
        acceptInlineTextHunk({
          current: current.content,
          aiContent: aiBlock.content,
          hunk,
          registry,
        }) &&
        discardInlineTextHunk({
          current: current.content,
          aiContent: aiBlock.content,
          hunk,
          registry,
        })
    );
  return isFullyActionable
    ? plan
    : {
        mode: 'block',
        origin: plan.origin,
        replacement: plan.replacement,
        reason: 'unsupported-inline-structure',
        metrics: plan.metrics,
      };
}

function renderRichTextComparison(
  current: Record<string, unknown>,
  aiBlock: Record<string, unknown>,
  registry: NotePluginRegistry,
  context?: NoteAiDiffComparisonContext
): HTMLElement {
  const root = document.createElement('span');
  root.className = styles.inlineComparison;
  root.dataset.aiDiffGranularity = 'word';
  const plan = resolveRichTextRenderPlan(current, aiBlock, registry);
  if (plan.mode !== 'inline') return root;
  let hunkIndex = 0;
  for (const hunk of plan.hunks) {
    if (hunk.mode === 'outside') {
      root.appendChild(
        renderInlineRange(aiBlock.content, hunk.replacementFrom, hunk.replacementTo, registry)
      );
      continue;
    }
    const hunkRoot = document.createElement('span');
    hunkRoot.className = styles.inlineHunk;
    hunkRoot.dataset.aiDiffHunk = 'true';
    hunkRoot.dataset.aiDiffHunkIndex = String(hunkIndex);
    let originOffset = hunk.originFrom;
    let replacementOffset = hunk.replacementFrom;
    for (const segment of hunk.segments) {
      const rendered = renderComparisonSegment({
        segment,
        originContent: current.content,
        replacementContent: aiBlock.content,
        originOffset,
        replacementOffset,
        registry,
      });
      originOffset = rendered.originOffset;
      replacementOffset = rendered.replacementOffset;
      hunkRoot.appendChild(rendered.element);
    }
    if (context) {
      const actions = document.createElement('span');
      actions.className = styles.inlineHunkActions;
      const target = { kind: 'text-hunk', index: hunkIndex } as const;
      actions.appendChild(context.renderAction('discard', target));
      actions.appendChild(context.renderAction('accept', target));
      hunkRoot.appendChild(actions);
    }
    root.appendChild(hunkRoot);
    hunkIndex += 1;
  }
  return root;
}

export const plainTextInlineAiDiff: NoteInlineAiDiff = {
  renderAiContent(aiContent) {
    return renderStyledText(typeof aiContent.text === 'string' ? aiContent.text : '', aiContent);
  },
};

export const plainLinkInlineAiDiff: NoteInlineAiDiff = {
  renderAiContent(aiContent, registry) {
    const link = document.createElement('a');
    const props = readInlineProps(aiContent);
    link.href = typeof aiContent.href === 'string' ? aiContent.href : String(props.href ?? '');
    link.target = '_blank';
    link.rel = 'noopener noreferrer nofollow';
    link.appendChild(renderInlineChildren(aiContent.content, registry));
    return link;
  },
};

export const richTextBlockAiDiff: NoteBlockAiDiff = {
  renderAiContent(aiBlock, registry) {
    const root = document.createElement('span');
    root.appendChild(renderInlineChildren(aiBlock.content, registry));
    return root;
  },
  comparison: {
    resolveMode(current, aiBlock, registry) {
      return resolveRichTextRenderPlan(current, aiBlock, registry).mode === 'inline'
        ? 'granular'
        : 'block';
    },
    render: renderRichTextComparison,
  },
  applyGranular(block, aiContent, action, target, registry) {
    if (block.type !== 'paragraph' || target.kind !== 'text-hunk') {
      return null;
    }
    const aiBlock = { ...block, content: aiContent };
    const plan = resolveRichTextRenderPlan(block, aiBlock, registry);
    if (plan.mode !== 'inline') return null;
    const hunk = plan.hunks.filter((item) => item.mode === 'hunk')[target.index];
    if (!hunk) return null;

    if (action === 'accept') {
      return acceptInlineTextHunk({
        current: block.content,
        aiContent,
        hunk,
        registry,
      });
    }

    return discardInlineTextHunk({
      current: block.content,
      aiContent,
      hunk,
      registry,
    });
  },
};
