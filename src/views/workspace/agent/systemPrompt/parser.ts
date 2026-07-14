import {
  AGENT_PROMPT_ROOT,
  DEFAULT_GUIDED_PROMPT_FIELDS,
  SOUL_PRESET_ALIASES,
  SOUL_PRESET_OPTIONS,
  SOUL_PROMPT_ROOT,
  composePresetRules,
  type GuidedPromptFields,
  type SoulPresetKey,
} from './template';

interface HeadingSection {
  title: string;
  level: number;
  path: string[];
  lineIndex: number;
  contentStart: number;
  contentEnd: number;
  content: string;
}
export interface GuidedPromptParseResult {
  compatible: boolean;
  soulEnabled: boolean;
  fields: GuidedPromptFields;
  residuals: Record<SoulPresetKey, string>;
  markdown: string;
}

type TextFieldKey = Exclude<keyof GuidedPromptFields, SoulPresetKey>;

const normalizeMarkdown = (value: string) => value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const trimContent = (value: string) =>
  value.replace(/^(?:[ \t]*\n)+/, '').replace(/(?:\n[ \t]*)+$/, '');
const normalizeRule = (value: string) =>
  value
    .trim()
    .replace(/[\u3000\s]+/g, '')
    .replace(/[，,]/g, '、')
    .replace(/[；;。.!！?？]+$/g, '');
const splitRules = (content: string) =>
  normalizeMarkdown(content)
    .split(/(?<=[。！？!?；;])|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

function scanHeadings(markdown: string): HeadingSection[] {
  const lines = normalizeMarkdown(markdown).split('\n');
  const headings: Array<Omit<HeadingSection, 'contentStart' | 'contentEnd' | 'content'>> = [];
  const stack: Array<{ title: string; level: number }> = [];
  let fence: string | null = null;
  let fenceLength = 0;
  lines.forEach((line, lineIndex) => {
    if (fence) {
      const close = line.match(/^[ \t]{0,3}(`{3,}|~{3,})[ \t]*$/);
      if (close && close[1][0] === fence && close[1].length >= fenceLength) {
        fence = null;
        fenceLength = 0;
      }
      return;
    }
    const open = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
    if (open) {
      fence = open[1][0];
      fenceLength = open[1].length;
      return;
    }
    const match = line.match(/^(#{1,3})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/);
    if (!match) return;
    const level = match[1].length;
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    const title = match[2].trim().replace(/[ \t]+/g, ' ');
    headings.push({ title, level, path: [...stack.map((x) => x.title), title], lineIndex });
    stack.push({ title, level });
  });
  return headings.map((heading, index) => {
    const next = headings[index + 1];
    const contentStart = heading.lineIndex + 1;
    const contentEnd = next?.lineIndex ?? lines.length;
    return {
      ...heading,
      contentStart,
      contentEnd,
      content: trimContent(lines.slice(contentStart, contentEnd).join('\n')),
    };
  });
}

const fieldSchemas = [
  ['overview', 2, [AGENT_PROMPT_ROOT, 'Overview']],
  ['context', 2, [AGENT_PROMPT_ROOT, 'Context']],
  ['workflow', 2, [AGENT_PROMPT_ROOT, 'Workflow']],
  ['outputFormat', 2, [AGENT_PROMPT_ROOT, 'Output Format']],
  ['exampleOutput', 3, [AGENT_PROMPT_ROOT, 'Output Format', 'Example Output 示例输出']],
  ['qualityChecks', 2, [AGENT_PROMPT_ROOT, 'Quality Checks']],
  ['whenToAsk', 2, [AGENT_PROMPT_ROOT, 'When To Ask First']],
  ['soulRole', 2, [SOUL_PROMPT_ROOT, '角色关系 Role & Relationship']],
  ['soulStyle', 2, [SOUL_PROMPT_ROOT, '说话方式 Communication Style']],
  ['soulInitiative', 2, [SOUL_PROMPT_ROOT, '主动程度 Initiative Level']],
  ['soulTaste', 2, [SOUL_PROMPT_ROOT, '结果偏好 Quality Taste']],
  ['soulTruth', 2, [SOUL_PROMPT_ROOT, '事实与不确定性 Truth & Uncertainty']],
  ['soulBoundaries', 2, [SOUL_PROMPT_ROOT, '底线 Boundaries']],
] as const;
const pathKey = (path: readonly string[]) => path.join('\u001f');

function parsePreset(key: SoulPresetKey, content: string) {
  const mapping = new Map<string, string[]>(
    (SOUL_PRESET_OPTIONS[key] as readonly string[]).map((option) => [
      normalizeRule(option),
      [option],
    ])
  );
  Object.entries(SOUL_PRESET_ALIASES[key]).forEach(([alias, values]) =>
    mapping.set(normalizeRule(alias), values)
  );
  const selected: string[] = [];
  const residual: string[] = [];
  splitRules(content).forEach((chunk) => {
    const values = mapping.get(normalizeRule(chunk));
    if (!values) {
      residual.push(chunk);
      return;
    }
    values.forEach((value) => {
      if (!selected.includes(value)) selected.push(value);
    });
  });
  selected.sort(
    (a, b) =>
      (SOUL_PRESET_OPTIONS[key] as readonly string[]).indexOf(a) -
      (SOUL_PRESET_OPTIONS[key] as readonly string[]).indexOf(b)
  );
  return { selected, residual: residual.join('\n') };
}

export function parseSoulPresetContent(key: SoulPresetKey, content: string) {
  return parsePreset(key, content);
}

export function parseGuidedPrompt(markdown: string): GuidedPromptParseResult {
  const normalized = normalizeMarkdown(markdown);
  const sections = scanHeadings(normalized);
  const roots = (title: string) =>
    sections.filter((item) => item.level === 1 && item.path.length === 1 && item.title === title);
  const agentRoots = roots(AGENT_PROMPT_ROOT);
  const soulRoots = roots(SOUL_PROMPT_ROOT);
  const soulEnabled = soulRoots.length > 0;
  const fields = structuredClone(DEFAULT_GUIDED_PROMPT_FIELDS);
  const residuals = {
    soulStyle: '',
    soulInitiative: '',
    soulTaste: '',
    soulTruth: '',
    soulBoundaries: '',
  };
  let compatible = agentRoots.length === 1 && (soulRoots.length === 0 || soulRoots.length === 1);
  fieldSchemas.forEach(([key, level, path]) => {
    if (!soulEnabled && path[0] === SOUL_PROMPT_ROOT) return;
    const matches = sections.filter(
      (item) => item.level === level && pathKey(item.path) === pathKey(path)
    );
    if (matches.length !== 1) {
      compatible = false;
      return;
    }
    const section = matches[0];
    if (key in residuals) {
      const parsed = parsePreset(key as SoulPresetKey, section.content);
      fields[key as SoulPresetKey] = parsed.selected;
      residuals[key as SoulPresetKey] = parsed.residual;
    } else {
      fields[key as keyof Omit<GuidedPromptFields, SoulPresetKey>] = section.content;
    }
  });
  return { compatible, soulEnabled, fields, residuals, markdown: normalized };
}

const headings: Record<keyof GuidedPromptFields, string> = {
  overview: '## Overview',
  context: '## Context',
  workflow: '## Workflow',
  outputFormat: '## Output Format',
  exampleOutput: '### Example Output 示例输出',
  qualityChecks: '## Quality Checks',
  whenToAsk: '## When To Ask First',
  soulRole: '## 角色关系 Role & Relationship',
  soulStyle: '## 说话方式 Communication Style',
  soulInitiative: '## 主动程度 Initiative Level',
  soulTaste: '## 结果偏好 Quality Taste',
  soulTruth: '## 事实与不确定性 Truth & Uncertainty',
  soulBoundaries: '## 底线 Boundaries',
};
function section(key: keyof GuidedPromptFields, value: string) {
  return value ? `${headings[key]}\n${value}` : headings[key];
}
export function buildGuidedPrompt(
  fields: GuidedPromptFields,
  soulEnabled = true,
  residuals: Record<SoulPresetKey, string> = {
    soulStyle: '',
    soulInitiative: '',
    soulTaste: '',
    soulTruth: '',
    soulBoundaries: '',
  }
) {
  const parts = [
    '# Agent',
    section('overview', fields.overview),
    section('context', fields.context),
    section('workflow', fields.workflow),
    section('outputFormat', fields.outputFormat),
    section('exampleOutput', fields.exampleOutput),
    section('qualityChecks', fields.qualityChecks),
    section('whenToAsk', fields.whenToAsk),
  ];
  if (soulEnabled) {
    parts.push('# SOUL（可选）', section('soulRole', fields.soulRole));
    (
      ['soulStyle', 'soulInitiative', 'soulTaste', 'soulTruth', 'soulBoundaries'] as SoulPresetKey[]
    ).forEach((key) =>
      parts.push(
        section(
          key,
          [composePresetRules(fields[key], key), residuals[key]].filter(Boolean).join('\n\n')
        )
      )
    );
  }
  return parts.join('\n\n');
}

const replaceSectionContent = (markdown: string, path: readonly string[], content: string) => {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split('\n');
  const matches = scanHeadings(normalized).filter((item) => pathKey(item.path) === pathKey(path));
  if (matches.length !== 1) return normalized;

  const match = matches[0];
  const replacement = content ? content.split('\n') : [];
  lines.splice(match.contentStart, match.contentEnd - match.contentStart, ...replacement);
  return lines.join('\n');
};

const fieldPaths = fieldSchemas.reduce<Record<keyof GuidedPromptFields, readonly string[]>>(
  (result, [key, , path]) => ({ ...result, [key]: path }),
  {} as Record<keyof GuidedPromptFields, readonly string[]>
);

export function syncGuidedPrompt(
  markdown: string,
  fields: GuidedPromptFields,
  residuals: Record<SoulPresetKey, string>
) {
  const parsed = parseGuidedPrompt(markdown);
  if (!parsed.compatible) return markdown;

  let next = parsed.markdown;
  const textKeys: TextFieldKey[] = [
    'overview',
    'context',
    'workflow',
    'outputFormat',
    'exampleOutput',
    'qualityChecks',
    'whenToAsk',
    'soulRole',
  ];
  textKeys.forEach((key) => {
    if (!parsed.soulEnabled && key === 'soulRole') return;
    next = replaceSectionContent(next, fieldPaths[key], fields[key]);
  });
  if (parsed.soulEnabled) {
    (Object.keys(residuals) as SoulPresetKey[]).forEach((key) => {
      next = replaceSectionContent(
        next,
        fieldPaths[key],
        [composePresetRules(fields[key], key), residuals[key]].filter(Boolean).join('\n\n')
      );
    });
  }
  return next;
}

export function setSoulEnabled(
  markdown: string,
  fields: GuidedPromptFields,
  residuals: Record<SoulPresetKey, string>,
  enabled: boolean
) {
  const parsed = parseGuidedPrompt(markdown);
  if (!parsed.compatible || parsed.soulEnabled === enabled) return parsed.markdown;

  if (enabled) {
    const soulBlock = buildGuidedPrompt(fields, true, residuals).split(
      `\n\n# ${SOUL_PROMPT_ROOT}`
    )[1];
    return `${parsed.markdown.trimEnd()}\n\n# ${SOUL_PROMPT_ROOT}${soulBlock}`;
  }

  const lines = parsed.markdown.split('\n');
  const sections = scanHeadings(parsed.markdown);
  const root = sections.find(
    (item) => item.level === 1 && item.path.length === 1 && item.title === SOUL_PROMPT_ROOT
  );
  if (!root) return parsed.markdown;
  const nextRoot = sections.find((item) => item.level === 1 && item.lineIndex > root.lineIndex);
  lines.splice(root.lineIndex, (nextRoot?.lineIndex ?? lines.length) - root.lineIndex);
  return lines.join('\n').trimEnd();
}
