import AppModal from '@/components/AppModal';
import { useGroupService } from '@/domains';
import type { DeleteGroupRequest } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { Input, TextField, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DissolveGroupModalProps } from './index.type';

import styles from './index.module.less';

function DissolveGroupModal({
  isOpen,
  onOpenChange,
  groupName,
  groupId,
  onSuccess,
}: DissolveGroupModalProps) {
  const groupService = useGroupService();
  const [confirmName, setConfirmName] = useState('');
  const navigate = useNavigate();

  const { loading, run: runDissolveGroup } = useRequest(
    async () => {
      const params: DeleteGroupRequest = { groupId: groupId! };
      await groupService.deleteGroup(params);
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success('已解散小组');
        setConfirmName('');
        onSuccess?.();
        onOpenChange(false);
        navigate('/app/my-group');
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleConfirm = () => {
    if (!groupId) {
      toast.warning('小组ID不存在');
      return;
    }
    runDissolveGroup();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setConfirmName('');
      onOpenChange(true);
      return;
    }
    if (loading) return;
    setConfirmName('');
    onOpenChange(false);
  };

  return (
    <AppModal
      type="danger"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="解散小组"
      description="确定要解散小组吗？此操作不可撤销！"
      confirmText="解散"
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isConfirmDisabled={confirmName !== groupName || loading}
      isDismissable={!loading}
    >
      <div className={styles.modalSection}>
        <div className={styles.modalSectionLabel}>
          小组名称 <span className={styles.modalSectionSubLabel}>（{groupName}）</span>
        </div>
        <TextField aria-label="确认小组名称" value={confirmName} onChange={setConfirmName}>
          <Input placeholder={`请输入 "${groupName}" 以确认`} />
        </TextField>
      </div>
    </AppModal>
  );
}

export default DissolveGroupModal;
