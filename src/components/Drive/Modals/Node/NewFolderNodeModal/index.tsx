import AppModal from '@/components/AppModal';
import { useDriveService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { validateReservedName } from '@/utils/tag/validateReservedName';
import { Input, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import type { NewFolderNodeModalProps } from './index.type';
import styles from './style.module.less';

function NewFolderNodeModal({
  isOpen,
  parentId,
  groupId,
  parentLabel,
  existingFolderNames = [],
  onOpenChange,
  onSuccess,
}: NewFolderNodeModalProps) {
  const driveService = useDriveService();
  const [name, setName] = useState('');

  const { loading, run: runCreateFolder } = useRequest(
    async (trimmed: string) => driveService.createFolder({ parentId, name: trimmed, groupId }),
    {
      manual: true,
      onSuccess: () => {
        toast.success('新建成功');
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.warning('请输入文件夹名称');
      return;
    }
    const validation = validateReservedName(trimmed);
    if (!validation.valid) {
      toast.warning(validation.reason);
      return;
    }
    if (existingFolderNames.includes(trimmed)) {
      toast.warning('当前目录下已存在同名文件夹');
      return;
    }
    runCreateFolder(trimmed);
  };

  const handleCancel = () => {
    setName('');
    onOpenChange(false);
  };

  return (
    <AppModal
      type="confirm"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="新建文件夹"
      confirmText="创建"
      onCancel={handleCancel}
      onConfirm={handleSubmit}
      isConfirmLoading={loading}
      isDismissable={!loading}
    >
      <div className={styles.pathHint}>
        {parentLabel ? `创建到「${parentLabel}」下` : '当前目录'}
      </div>
      <TextField
        aria-label="文件夹名称"
        className={styles.input}
        value={name}
        autoFocus
        onChange={setName}
      >
        <Input
          placeholder="请输入文件夹名称"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
      </TextField>
    </AppModal>
  );
}

export default NewFolderNodeModal;
