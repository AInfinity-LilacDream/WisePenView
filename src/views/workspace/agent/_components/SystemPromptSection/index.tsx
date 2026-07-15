import { FormField, TextArea } from '@/components/Input';
import { Button, Switch, Tabs } from '@heroui/react';
import { useState } from 'react';
import type { GuidedPromptFields, SoulFieldKey } from '../../systemPrompt';
import {
  buildGuidedPrompt,
  DEFAULT_GUIDED_PROMPT_FIELDS,
  parseGuidedPrompt,
  setSoulEnabled,
  syncGuidedPrompt,
} from '../../systemPrompt';
import PresetRestoreConfirmDialog from '../PresetRestoreConfirmDialog';
import SectionShell from '../SectionShell';
import styles from './style.module.less';
export type PromptMode = 'guided' | 'free';
interface Props {
  markdown: string;
  mode: PromptMode;
  disabled: boolean;
  onMarkdownChange: (value: string) => void;
  onModeRequest: (mode: PromptMode) => void;
}
const textFields: Array<{
  key: keyof GuidedPromptFields;
  label: string;
  description: string;
  rows?: number;
}> = [
  {
    key: 'overview',
    label: 'Overview',
    description: '这个 Agent 是做什么的？适合用在哪些场景？不适合做什么？',
  },
  { key: 'context', label: 'Context', description: '它需要知道哪些背景？' },
  { key: 'workflow', label: 'Workflow', description: '它应该如何处理任务？' },
  { key: 'outputFormat', label: 'Output Format', description: '它应该如何组织回答？' },
  {
    key: 'exampleOutput',
    label: 'Example Output 示例输出',
    description: '提供一份可以按任务替换的回答骨架。',
    rows: 7,
  },
  { key: 'qualityChecks', label: 'Quality Checks', description: '它如何确保结果可靠？' },
  { key: 'whenToAsk', label: 'When To Ask First', description: '什么情况下必须先问用户？' },
];
const soulFields: Array<{ key: SoulFieldKey; label: string; description: string }> = [
  { key: 'soulStyle', label: '说话方式 Communication Style', description: '它应该怎么表达？' },
  { key: 'soulInitiative', label: '主动程度 Initiative Level', description: '它应该多主动？' },
  { key: 'soulTaste', label: '结果偏好 Quality Taste', description: '它认为什么是好的结果？' },
  {
    key: 'soulTruth',
    label: '事实与不确定性 Truth & Uncertainty',
    description: '它如何处理事实、证据、推测和不确定？',
  },
  { key: 'soulBoundaries', label: '底线 Boundaries', description: '它绝对不应该做什么？' },
];

export default function SystemPromptSection({
  markdown,
  mode,
  disabled,
  onMarkdownChange,
  onModeRequest,
}: Props) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const parsed = parseGuidedPrompt(markdown);
  const fields = parsed.compatible ? parsed.fields : DEFAULT_GUIDED_PROMPT_FIELDS;
  const update = (next: GuidedPromptFields) => onMarkdownChange(syncGuidedPrompt(markdown, next));
  return (
    <>
      <SectionShell
        id="prompt"
        title="System Prompt"
        description="通过表单维护预设内容，也可以切换到自由编辑处理完整 Markdown。"
        actions={
          <Tabs
            className={styles.tabs}
            selectedKey={mode}
            onSelectionChange={(key) => {
              const nextMode = String(key);
              if (nextMode === 'guided' || nextMode === 'free') onModeRequest(nextMode);
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List className={styles.tabList} aria-label="System Prompt 编辑模式">
                <Tabs.Tab id="guided" className={styles.tab}>
                  引导填写
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="free" className={styles.tab}>
                  自由编辑
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        }
      >
        {mode === 'free' ? (
          <div>
            <div className={styles.editorHead}>
              <strong>System Prompt Markdown</strong>
              <span data-compatible={parsed.compatible}>
                {parsed.compatible ? '当前内容可返回引导填写' : '当前内容已不可返回引导填写'}
              </span>
            </div>
            <FormField
              aria-label="System Prompt Markdown"
              value={markdown}
              isDisabled={disabled}
              onChange={onMarkdownChange}
            >
              <TextArea className={styles.markdown} />
            </FormField>
          </div>
        ) : (
          <div className={styles.guided}>
            <div className={styles.groupHead}>
              <div>
                <strong>Agent</strong>
                <p>定义用途、工作方法、输出组织和必要确认边界。</p>
              </div>
              <Button
                className={styles.presetButton}
                size="sm"
                variant="secondary"
                isDisabled={disabled}
                onPress={() => setRestoreOpen(true)}
              >
                恢复通用预设
              </Button>
            </div>
            {textFields.map((field) => (
              <div key={field.key} className={styles.promptField}>
                <FormField
                  label={field.label}
                  description={field.description}
                  value={String(fields[field.key])}
                  isDisabled={disabled}
                  onChange={(value) => update({ ...fields, [field.key]: value })}
                >
                  <TextArea rows={field.rows ?? 4} />
                </FormField>
              </div>
            ))}
            <div className={styles.soulHead}>
              <div>
                <strong>SOUL（可选）</strong>
                <p>补充协作关系、表达偏好、主动程度和行为底线。</p>
              </div>
              <Switch
                size="md"
                aria-label="启用 SOUL"
                isSelected={parsed.soulEnabled}
                isDisabled={disabled}
                onChange={(selected) =>
                  onMarkdownChange(setSoulEnabled(markdown, fields, selected))
                }
              >
                <Switch.Content className={styles.switchContent}>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </div>
            {parsed.soulEnabled ? (
              <>
                <div className={styles.promptField}>
                  <FormField
                    label="角色关系 Role & Relationship"
                    description="它应该以什么身份和用户协作？"
                    value={fields.soulRole}
                    isDisabled={disabled}
                    onChange={(value) => update({ ...fields, soulRole: value })}
                  >
                    <TextArea rows={4} />
                  </FormField>
                </div>
                {soulFields.map((field) => (
                  <div key={field.key} className={styles.presetField}>
                    <FormField
                      label={field.label}
                      description={field.description}
                      value={fields[field.key]}
                      isDisabled={disabled}
                      onChange={(value) => update({ ...fields, [field.key]: value })}
                    >
                      <TextArea rows={3} />
                    </FormField>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        )}
      </SectionShell>
      <PresetRestoreConfirmDialog
        isOpen={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="恢复通用预设？"
        description="这会用通用模板重建 System Prompt，当前填写内容和 SOUL 内容都会被覆盖。"
        onConfirm={() => {
          onMarkdownChange(buildGuidedPrompt(DEFAULT_GUIDED_PROMPT_FIELDS, true));
          setRestoreOpen(false);
        }}
      />
    </>
  );
}
