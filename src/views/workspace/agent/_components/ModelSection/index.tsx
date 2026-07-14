import ModelSelector from '@/components/ModelSelector';
import type { AgentSpec } from '@/domains/Agent';
import type { ChatModel } from '@/domains/Chat';
import { useState } from 'react';
import SectionShell from '../SectionShell';
import SettingRow from '../SettingRow';
import styles from './style.module.less';

interface Props {
  spec: AgentSpec;
  models: ChatModel[];
  disabled: boolean;
  onChange: (spec: AgentSpec) => void;
}

export default function ModelSection({ spec, models, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = models.find(
    (model) =>
      model.modelId === spec.modelPolicy.defaultModelId &&
      (!spec.modelPolicy.defaultProviderId ||
        model.providerId === spec.modelPolicy.defaultProviderId)
  );

  const selectModel = (model: ChatModel) => {
    onChange({
      ...spec,
      modelPolicy: {
        ...spec.modelPolicy,
        defaultModelId: model.modelId,
        defaultProviderId: model.providerId ?? '',
      },
    });
    setOpen(false);
  };

  return (
    <SectionShell
      id="model"
      title="模型配置"
      description="选择 Agent 默认使用的模型，以及是否允许用户在对话时切换。"
    >
      <div className={styles.modelRow}>
        <div>
          <strong>默认模型</strong>
          <span>从当前账号可用模型中选择</span>
        </div>
        <ModelSelector
          models={models}
          selectedId={selected?.id}
          isOpen={open}
          onOpenChange={setOpen}
          onChange={selectModel}
          disabled={disabled || models.length === 0}
        />
      </div>
      <SettingRow
        title="允许对话中切换模型"
        description="关闭后，正式会话固定使用上述模型。"
        selected={spec.modelPolicy.allowRequestOverride}
        disabled={disabled}
        onChange={(value) =>
          onChange({
            ...spec,
            modelPolicy: { ...spec.modelPolicy, allowRequestOverride: value },
          })
        }
      />
    </SectionShell>
  );
}
