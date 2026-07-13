import type {
  BlockNoteEditor,
  BlockSchema,
  BlockSpecs,
  ExtensionFactoryInstance,
  InlineContentConfig,
  InlineContentSchema,
  InlineContentSpec,
  StyleSchema,
} from '@blocknote/core';
import type { DefaultReactSuggestionItem } from '@blocknote/react';
import type { EditorProps } from '@tiptap/pm/view';
import type { LucideIcon } from 'lucide-react';

import type { AiDiffDisplayMode } from '@/domains/Note';

export type NoteInlineContentSpecs = Record<string, InlineContentSpec<InlineContentConfig>>;

export type PluginEditor = BlockNoteEditor<BlockSchema, InlineContentSchema, StyleSchema>;

export type NoteCapabilityDeclaration =
  | { support: 'default' }
  | { support: 'custom' }
  | { support: 'inherited' }
  | { support: 'unsupported'; reason: string };

export interface NoteContentCapabilityDeclarations {
  markdownImport: NoteCapabilityDeclaration;
  markdownExport: NoteCapabilityDeclaration;
  aiDiff: NoteCapabilityDeclaration;
  projection: NoteCapabilityDeclaration;
  print: NoteCapabilityDeclaration;
}

export interface NoteBlockProjection {
  plainText?: (block: Record<string, unknown>, registry: NotePluginRegistry) => string;
  outlineLevel?: (block: Record<string, unknown>) => number | undefined;
}

export interface NoteInlineProjection {
  plainText: (inline: Record<string, unknown>, registry: NotePluginRegistry) => string;
}

export interface NoteMarkdownExportContext {
  aiDiffDisplayMode: AiDiffDisplayMode;
}

export interface NoteMarkdownExportProjection {
  project: (
    node: Record<string, unknown>,
    context: NoteMarkdownExportContext
  ) => Record<string, unknown> | null;
  /** 仅用于 BlockNote 默认 serializer 无法保真的叶子 block。 */
  renderMarkdown?: (node: Record<string, unknown>, context: NoteMarkdownExportContext) => string;
}

export type NoteAiDiffAction = 'accept' | 'discard';

export interface NoteAiContentCandidate {
  props: Record<string, unknown>;
  content: unknown;
}

export interface NoteAiContentPayload {
  revision: string;
  baseHash: string;
  operation: 'create' | 'update' | 'delete';
  candidate: NoteAiContentCandidate | null;
}

export interface NoteAiDiffBlockProjection {
  current: Record<string, unknown> | null;
  candidate: Record<string, unknown> | null;
  stale: boolean;
}

export type NoteAiDiffBlockMutation =
  | { kind: 'none' }
  | { kind: 'remove' }
  | { kind: 'update'; props: Record<string, unknown>; content?: unknown };

export interface NoteInlineAiDiff {
  equals: (current: Record<string, unknown>, candidate: Record<string, unknown>) => boolean;
  renderCandidate: (
    candidate: Record<string, unknown>,
    registry: NotePluginRegistry
  ) => HTMLElement;
}

export interface NoteContentComments {
  documentThreads: 'range' | 'dedicated' | 'unsupported';
  hideFormattingToolbar?: boolean;
}

export interface NotePrintContribution {
  styles: readonly string[];
}

export interface NoteBlockAiDiff {
  resolve: (
    block: Record<string, unknown>,
    aiContent: NoteAiContentPayload,
    registry: NotePluginRegistry
  ) => NoteAiDiffBlockProjection | null;
  renderCandidate: (
    candidate: Record<string, unknown>,
    registry: NotePluginRegistry
  ) => HTMLElement;
  apply: (
    block: Record<string, unknown>,
    aiContent: NoteAiContentPayload,
    action: NoteAiDiffAction,
    registry: NotePluginRegistry
  ) => NoteAiDiffBlockMutation;
}

export type NoteMarkdownImportSegment =
  { type: 'text'; text: string } | { type: 'token'; value: string };

export interface NoteMarkdownImportContext {
  createToken: (value: string) => string;
  readExactToken: (text: string) => string | undefined;
  splitTokens: (text: string) => NoteMarkdownImportSegment[];
}

export interface NoteMarkdownBlockImport {
  prepare?: (markdown: string, context: NoteMarkdownImportContext) => string;
  restore: (
    block: Record<string, unknown>,
    context: NoteMarkdownImportContext
  ) => Record<string, unknown> | undefined;
}

export interface NoteMarkdownInlineImport {
  prepare?: (markdown: string, context: NoteMarkdownImportContext) => string;
  restore: (
    inline: Record<string, unknown>,
    context: NoteMarkdownImportContext
  ) => readonly Record<string, unknown>[] | undefined;
}

export interface NoteSideMenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: 'command' | 'toggle';
  selected?: boolean;
}

export interface NoteSideMenuState {
  variant?: 'standard' | 'structured';
  attributes?: Readonly<Record<string, string | undefined>>;
  actions?: readonly NoteSideMenuAction[];
}

export interface NoteBlockSideMenu {
  icon?: LucideIcon;
  inspect?: (block: Record<string, unknown>) => NoteSideMenuState;
  apply?: (
    block: Record<string, unknown>,
    actionId: string
  ) => { type?: string; props?: Record<string, unknown>; content?: unknown } | null;
}

export type NoteBlockContentModel = 'inline' | 'table' | 'none';

export interface NoteBlockInsertion {
  default?: boolean;
  createEmpty: () => Record<string, unknown>;
}

export interface NoteBlockInputRules {
  inlineMathDollar?: boolean;
}

interface NotePluginNodeBase {
  id: string;
  dependencies?: readonly string[];
}

interface NoteContentPluginBase extends NotePluginNodeBase {
  type: string;
  capabilities: NoteContentCapabilityDeclarations;
  comments: NoteContentComments;
  print?: NotePrintContribution;
  extensions?: (context: NotePluginRuntimeContext) => ExtensionFactoryInstance[];
  editorProps?: (context: NotePluginRuntimeContext) => Partial<EditorProps>;
  slashMenu?: (ctx: { editor: PluginEditor }) => DefaultReactSuggestionItem[];
}

export interface NoteBlockPlugin extends NoteContentPluginBase {
  kind: 'block';
  spec: BlockSpecs[string];
  contentModel: NoteBlockContentModel;
  insertion?: NoteBlockInsertion;
  inputRules?: NoteBlockInputRules;
  projection?: NoteBlockProjection;
  markdownImport?: NoteMarkdownBlockImport;
  markdownExport?: NoteMarkdownExportProjection;
  aiDiff?: NoteBlockAiDiff;
  sideMenu?: NoteBlockSideMenu;
}

export interface NoteInlinePlugin extends NoteContentPluginBase {
  kind: 'inline';
  spec: InlineContentSpec<InlineContentConfig>;
  projection?: NoteInlineProjection;
  markdownImport?: NoteMarkdownInlineImport;
  markdownExport?: NoteMarkdownExportProjection;
  aiDiff: NoteInlineAiDiff;
}

export interface NotePluginBundle extends NotePluginNodeBase {
  kind: 'bundle';
  children: readonly NotePluginNode[];
}

export type NoteContentPlugin = NoteBlockPlugin | NoteInlinePlugin;
export type NotePluginNode = NotePluginBundle | NoteContentPlugin;

export interface NoteRuntimeExtension extends NotePluginNodeBase {
  print?: NotePrintContribution;
  extensions?: (context: NotePluginRuntimeContext) => ExtensionFactoryInstance[];
  editorProps?: (context: NotePluginRuntimeContext) => Partial<EditorProps>;
}

export interface NotePluginRuntimeContext {
  registry: NotePluginRegistry;
}

export interface NotePluginRegistry {
  root: NotePluginBundle;
  contentPlugins: readonly NoteContentPlugin[];
  blockPlugins: ReadonlyMap<string, NoteBlockPlugin>;
  inlinePlugins: ReadonlyMap<string, NoteInlinePlugin>;
  defaultBlock?: NoteBlockInsertion;
  runtimeExtensions: readonly NoteRuntimeExtension[];
}
