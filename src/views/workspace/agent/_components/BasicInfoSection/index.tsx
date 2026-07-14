import { FormField, Input, TextArea } from '@/components/Input';
import type { AgentSpec } from '@/domains/Agent';
import SectionShell from '../SectionShell';
import SettingRow from '../SettingRow';
import styles from './style.module.less';

interface Props {
  name: string;
  description: string;
  spec: AgentSpec;
  disabled: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSpecChange: (spec: AgentSpec) => void;
}

export default function BasicInfoSection({
  name,
  description,
  spec,
  disabled,
  onNameChange,
  onDescriptionChange,
  onSpecChange,
}: Props) {
  return (
    <SectionShell
      id="agent-info"
      title="Agent Info"
      description="填写 Agent 的内部名称和用途说明。资源标题仍由云盘管理。"
    >
      <div className={styles.form}>
        <FormField
          label="name"
          description="建议使用稳定的英文名称。"
          value={name}
          isDisabled={disabled}
          onChange={onNameChange}
        >
          <Input maxLength={64} placeholder="course_research_assistant" />
        </FormField>
        <FormField
          label="description"
          description="清晰描述有助于用户理解 Agent 的用途。"
          value={description}
          isDisabled={disabled}
          onChange={onDescriptionChange}
        >
          <TextArea maxLength={500} rows={4} placeholder="概括这个 Agent 适合处理的任务" />
        </FormField>
        <SettingRow
          title="自动生成会话标题"
          description="首次对话后，根据用户问题生成简短标题。"
          selected={spec.autoGenerateTitle}
          disabled={disabled}
          onChange={(value) => onSpecChange({ ...spec, autoGenerateTitle: value })}
        />
      </div>
    </SectionShell>
  );
}
