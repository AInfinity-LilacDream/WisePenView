import { FormField, TextArea } from '@/components/Input';
import { DEFAULT_AGENT_SPEC, type AgentSpec } from '@/domains/Agent';
import { Button, Label, NumberField, Slider } from '@heroui/react';
import { useState } from 'react';
import PresetRestoreConfirmDialog from '../PresetRestoreConfirmDialog';
import SectionShell from '../SectionShell';
import SettingRow from '../SettingRow';
import styles from './style.module.less';

interface Props {
  spec: AgentSpec;
  disabled: boolean;
  onChange: (spec: AgentSpec) => void;
}

const toScalar = (value: number | number[]) => (Array.isArray(value) ? value[0] : value);

export default function MemorySection({ spec, disabled, onChange }: Props) {
  const [more, setMore] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const policy = spec.memoryPolicy;
  const updatePolicy = (next: Partial<typeof policy>) => {
    onChange({ ...spec, memoryPolicy: { ...policy, ...next } });
  };
  const restoreRecommendedSettings = () => {
    const recommended = DEFAULT_AGENT_SPEC.memoryPolicy;
    updatePolicy({
      highWatermarkRatio: recommended.highWatermarkRatio,
      lowWatermarkRatio: recommended.lowWatermarkRatio,
      summaryPrompt: recommended.summaryPrompt,
      longTermMemoryLimit: recommended.longTermMemoryLimit,
      longTermMemoryScoreThreshold: recommended.longTermMemoryScoreThreshold,
    });
  };

  return (
    <>
      <SectionShell
        id="memory"
        title="记忆策略"
        description="控制 Agent 如何使用当前会话、历史会话和长期记忆。"
      >
        <SettingRow
          title="会话记忆"
          description="参考当前会话中的历史消息，保持上下文连续。"
          selected={policy.enableChatMemory}
          disabled={disabled}
          onChange={(value) => updatePolicy({ enableChatMemory: value })}
        />
        {policy.enableChatMemory ? (
          <>
            <SettingRow
              title="保存会话记录"
              description="重新打开会话后仍可继续。"
              selected={policy.enablePersistenceChatMemory}
              disabled={disabled}
              onChange={(value) => updatePolicy({ enablePersistenceChatMemory: value })}
            />
            <SettingRow
              title="自动总结长对话"
              description="接近上下文上限时压缩较早消息。"
              selected={policy.enableChatMemorySummary}
              disabled={disabled}
              onChange={(value) => updatePolicy({ enableChatMemorySummary: value })}
            />
          </>
        ) : null}
        <SettingRow
          title="跨会话长期记忆"
          description="在后续会话中使用相关事实和偏好。"
          selected={policy.enableLongTermMemory}
          disabled={disabled}
          onChange={(value) => updatePolicy({ enableLongTermMemory: value })}
        />
        <div className={styles.moreRow}>
          <Button
            className={styles.more}
            size="sm"
            variant="ghost"
            onPress={() => setMore((value) => !value)}
          >
            {more ? '收起设置' : '更多设置'}
          </Button>
        </div>
        {more ? (
          <div className={styles.advanced}>
            <div className={styles.advancedHeader}>
              <span>高级参数</span>
              <Button
                className={styles.presetButton}
                size="sm"
                variant="secondary"
                isDisabled={disabled}
                onPress={() => setRestoreOpen(true)}
              >
                恢复推荐预设
              </Button>
            </div>
            <div className={styles.settingGrid}>
              <div>
                <Label>总结触发比例 {Math.round(policy.highWatermarkRatio * 100)}%</Label>
                <Slider
                  minValue={0.5}
                  maxValue={0.95}
                  step={0.05}
                  value={policy.highWatermarkRatio}
                  isDisabled={disabled || !policy.enableChatMemorySummary}
                  onChange={(value) => updatePolicy({ highWatermarkRatio: toScalar(value) })}
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </div>
              <div>
                <Label>总结结束比例 {Math.round(policy.lowWatermarkRatio * 100)}%</Label>
                <Slider
                  minValue={0.1}
                  maxValue={0.8}
                  step={0.05}
                  value={policy.lowWatermarkRatio}
                  isDisabled={disabled || !policy.enableChatMemorySummary}
                  onChange={(value) => updatePolicy({ lowWatermarkRatio: toScalar(value) })}
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </div>
            </div>
            <div className={styles.settingGrid}>
              <NumberField
                value={policy.longTermMemoryLimit}
                minValue={1}
                maxValue={50}
                step={1}
                isDisabled={disabled || !policy.enableLongTermMemory}
                onChange={(value) => updatePolicy({ longTermMemoryLimit: Number(value) })}
              >
                <Label>长期记忆召回数量</Label>
                <div className={styles.controlLine}>
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </div>
              </NumberField>
              <div>
                <Label>
                  长期记忆相关度 {Math.round(policy.longTermMemoryScoreThreshold * 100)}%
                </Label>
                <div className={styles.controlLine}>
                  <Slider
                    minValue={0}
                    maxValue={1}
                    step={0.05}
                    value={policy.longTermMemoryScoreThreshold}
                    isDisabled={disabled || !policy.enableLongTermMemory}
                    onChange={(value) =>
                      updatePolicy({ longTermMemoryScoreThreshold: toScalar(value) })
                    }
                  >
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                </div>
              </div>
            </div>
            <FormField
              label="总结提示词"
              value={policy.summaryPrompt ?? ''}
              isDisabled={disabled || !policy.enableChatMemorySummary}
              onChange={(value) => updatePolicy({ summaryPrompt: value || undefined })}
            >
              <TextArea rows={3} placeholder="留空时使用 WisePen 默认摘要方式" />
            </FormField>
          </div>
        ) : null}
      </SectionShell>
      <PresetRestoreConfirmDialog
        isOpen={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="恢复推荐预设？"
        description="这会把高级参数恢复为 WisePen 推荐值，当前修改过的比例、召回数量、相关度和总结提示词都会被覆盖。四个记忆开关不会变化。"
        onConfirm={() => {
          restoreRecommendedSettings();
          setRestoreOpen(false);
        }}
      />
    </>
  );
}
