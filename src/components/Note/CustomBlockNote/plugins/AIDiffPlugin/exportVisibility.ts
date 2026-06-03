import { AI_DIFF_DISPLAY_MODE, type AiDiffDisplayMode } from '@/domains/Note';

type InlineContentLike = {
  type?: unknown;
  text?: unknown;
  props?: unknown;
};

function isInlineContentLike(v: unknown): v is InlineContentLike {
  return typeof v === 'object' && v !== null;
}

function getInlineType(v: unknown): string {
  if (!isInlineContentLike(v)) return '';
  return typeof v.type === 'string' ? v.type : '';
}

function getInlineText(v: unknown): string {
  if (!isInlineContentLike(v)) return '';
  return typeof v.text === 'string' ? v.text : '';
}

function getInlineFieldString(v: unknown, key: string): string {
  if (!isInlineContentLike(v)) return '';
  const value = (v as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function getInlineProps(v: unknown): Record<string, unknown> | null {
  if (!isInlineContentLike(v)) return null;
  if (typeof v.props !== 'object' || v.props === null) return null;
  return v.props as Record<string, unknown>;
}

function getPropString(props: Record<string, unknown> | null, key: string): string {
  const value = props?.[key];
  return typeof value === 'string' ? value : '';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** 行内节点在当前 AIDiff 展示模式下是否应对用户可见（与块折叠装饰一致） */
export function isInlineVisibleInMode(item: unknown, displayMode: AiDiffDisplayMode): boolean {
  const type = getInlineType(item);
  if (type === 'text') {
    return getInlineText(item).trim() !== '';
  }
  if (type === 'ai-add') {
    const text = getPropString(getInlineProps(item), 'text');
    if (!text) return false;
    return displayMode !== AI_DIFF_DISPLAY_MODE.OLD_ONLY;
  }
  if (type === 'ai-delete') {
    const text = getPropString(getInlineProps(item), 'text');
    if (!text) return false;
    return displayMode !== AI_DIFF_DISPLAY_MODE.NEW_ONLY;
  }
  if (type === 'ai-diff') {
    const props = getInlineProps(item);
    const origin = getPropString(props, 'origin');
    const replace = getPropString(props, 'replace');
    if (displayMode === AI_DIFF_DISPLAY_MODE.OLD_ONLY) return origin !== '';
    if (displayMode === AI_DIFF_DISPLAY_MODE.NEW_ONLY) return replace !== '';
    return origin !== '' || replace !== '';
  }
  if (type === 'AI-Create') {
    const text = getInlineText(item);
    if (!text) return false;
    return displayMode !== AI_DIFF_DISPLAY_MODE.OLD_ONLY;
  }
  if (type === 'AI-Delete') {
    const text = getInlineText(item);
    if (!text) return false;
    return displayMode !== AI_DIFF_DISPLAY_MODE.NEW_ONLY;
  }
  if (type === 'AI-Edit') {
    const origin = getInlineFieldString(item, 'old_text');
    const replace = getInlineFieldString(item, 'new_text');
    if (displayMode === AI_DIFF_DISPLAY_MODE.OLD_ONLY) return origin !== '';
    if (displayMode === AI_DIFF_DISPLAY_MODE.NEW_ONLY) return replace !== '';
    return origin !== '' || replace !== '';
  }

  return true;
}

function hasAnyAiInline(content: readonly unknown[]): boolean {
  return content.some((item) => {
    const type = getInlineType(item);
    return (
      type === 'ai-diff' ||
      type === 'ai-add' ||
      type === 'ai-delete' ||
      type === 'AI-Create' ||
      type === 'AI-Delete' ||
      type === 'AI-Edit'
    );
  });
}

/** 非对比模式下，块内是否无任何可见行内（应整块折叠/从导出省略） */
export function shouldFoldInlineContent(
  content: readonly unknown[],
  displayMode: AiDiffDisplayMode
): boolean {
  if (displayMode === AI_DIFF_DISPLAY_MODE.COMPARE) return false;
  if (content.length === 0) return false;
  if (!hasAnyAiInline(content)) return false;
  return !content.some((item) => isInlineVisibleInMode(item, displayMode));
}
