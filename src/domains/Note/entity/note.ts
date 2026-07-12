/**
 * Note 同步相关类型定义
 * 与 blocknote/docs/API.md、design-editor-final 对齐
 */

export type DeltaOp = 'insert' | 'update' | 'delete' | 'move';

export interface JsonDelta {
  op: DeltaOp;
  blockId: string;
  data?: unknown;
  timestamp: number;
  seqId: number;
  /** 首次操作，用于判断块是否本地创建。 */
  firstOp?: DeltaOp;
}

export interface SyncPayload {
  base_version?: number;
  send_timestamp: number;
  deltas: JsonDelta[];
}

export interface SendPayload {
  sendTimestamp: number;
  deltas: JsonDelta[];
}

export interface NoteChange {
  type: 'insert' | 'update' | 'delete' | 'move';
  block: { id: string } & Record<string, unknown>;
}

export interface Block {
  id: string;
  type: string;
  props: Record<string, boolean | number | string>;
  content: InlineContent[] | TableContent | undefined;
  children: Block[];
}

export type InlineContent = StyledText | Link | CustomInlineContent;

export interface StyledText {
  type: 'text';
  text: string;
  styles: Record<string, string>;
}

export interface Link {
  type: 'link';
  content: StyledText[];
  href: string;
}

export interface CustomInlineContent {
  type: string;
  content: StyledText[] | undefined;
  props: Record<string, boolean | number | string>;
}

export type TableContent = unknown;
