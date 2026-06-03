import type { PluginEditor } from '../types';

/**
 * LaTeX 插件在 Markdown 下载链路中的职责：
 * - **主序列化**：由 `inlineMath`、`math` 各自的 `toExternalHTML` 写入可被 BlockNote
 *   `blocksToMarkdownLossy`（外部 HTML → Markdown）识别的字符串形态；
 * - **全局补丁**：若将来需在整篇 MD 上做与安全上下文无关的替换，可在此实现并挂上
 *   `NoteEditorPlugin.blocksToMarkdownLossy`。
 */
export function latexBlocksToMarkdownLossy(
  markdown: string,
  _ctx: { editor: PluginEditor }
): string {
  void _ctx;
  return markdown;
}
