import type { ResourceComment } from '@/domains/Resource';

import { IMAGE_ONLY_CONTENT } from './constants';

const commentTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const getValidCommentDate = (timestamp: number): Date | null => {
  if (timestamp <= 0) return null;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const getAuthorInitial = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || '?';

export const hasVisibleCommentContent = (content: string): boolean =>
  content.trim().length > 0 && content !== IMAGE_ONLY_CONTENT;

export const normalizeCommentImageUrl = (url: string): string => {
  const value = url.trim();
  if (!value) return '';
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  if (value.startsWith('//')) return `${window.location.protocol}${value}`;
  if (value.startsWith('/')) return `${window.location.origin}${value}`;
  if (/^[^/\s]+\.[^/\s]+\/.+/.test(value)) return `${window.location.protocol}//${value}`;
  return encodeURI(value);
};

export const formatCommentTime = (timestamp: number): string => {
  const date = getValidCommentDate(timestamp);
  return date ? commentTimeFormatter.format(date) : '时间未知';
};

export const getCommentDateTime = (timestamp: number): string | undefined =>
  getValidCommentDate(timestamp)?.toISOString();

export const resizeCommentTextarea = (textarea: HTMLTextAreaElement | null): void => {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export const updateCommentById = (
  commentEntries: ResourceComment[],
  commentId: string,
  update: (commentEntry: ResourceComment) => ResourceComment
): ResourceComment[] =>
  commentEntries.map((commentEntry) =>
    commentEntry.commentId === commentId ? update(commentEntry) : commentEntry
  );
