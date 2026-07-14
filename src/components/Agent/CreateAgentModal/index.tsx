import { Input, TextArea } from '@/components/Input';
import AppModal from '@/components/Overlay/AppModal';
import { useAgentService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { Button, Label, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import styles from './style.module.less';

interface CreateAgentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (resourceId: string) => void;
}
function CreateAgentModal({ isOpen, onOpenChange, onSuccess }: CreateAgentModalProps) {
  const agentService = useAgentService();
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const reset = () => {
    setTitle('');
    setName('');
    setDescription('');
  };
  const { loading, run } = useRequest(
    () =>
      agentService.createAgent(
        title.trim(),
        name.trim() || undefined,
        description.trim() || undefined
      ),
    {
      manual: true,
      onSuccess: (id) => {
        reset();
        onSuccess(id);
      },
      onError: (error) => toast.danger(parseErrorMessage(error)),
    }
  );
  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };
  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="创建新 Agent"
      size="lg"
      isDismissable={!loading}
      actions={
        <>
          <Button variant="secondary" isDisabled={loading} onPress={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button variant="primary" isDisabled={!title.trim() || loading} onPress={() => run()}>
            创建
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField value={title} onChange={setTitle} isRequired>
          <Label>文件名（显示用）*</Label>
          <Input autoFocus placeholder="例如：课程研究助手" />
        </TextField>
        <TextField value={name} onChange={setName}>
          <Label>Agent 名称（模型用）</Label>
          <Input placeholder="course_research_assistant" />
        </TextField>
        <TextField value={description} onChange={setDescription}>
          <Label>描述（模型用）</Label>
          <TextArea rows={3} placeholder="描述这个 Agent 适合处理的任务" />
        </TextField>
      </div>
    </AppModal>
  );
}
export default CreateAgentModal;
