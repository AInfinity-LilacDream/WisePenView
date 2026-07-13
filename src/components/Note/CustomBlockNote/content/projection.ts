import type { NotePluginRegistry } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function projectInlinePlainText(content: unknown, registry: NotePluginRegistry): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter(isRecord)
    .map((inline) => {
      const type = typeof inline.type === 'string' ? inline.type : '';
      return registry.inlinePlugins.get(type)?.projection?.plainText(inline, registry) ?? '';
    })
    .join('');
}

export function projectBlockPlainText(block: unknown, registry: NotePluginRegistry): string {
  if (!isRecord(block)) return '';
  const type = typeof block.type === 'string' ? block.type : '';
  const owner = registry.blockPlugins.get(type);
  if (owner?.projection?.plainText) {
    return owner.projection.plainText(block, registry);
  }
  return projectInlinePlainText(block.content, registry);
}
