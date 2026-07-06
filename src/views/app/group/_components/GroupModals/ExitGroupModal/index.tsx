import AppModal from '@/components/AppModal';
import { useGroupService } from '@/domains';
import type { QuitGroupRequest } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import type { ExitGroupModalProps } from './index.type';

import styles from './index.module.less';

function ExitGroupModal({
  isOpen,
  onOpenChange,
  groupName,
  groupId,
  onSuccess,
}: ExitGroupModalProps) {
  const groupService = useGroupService();
  const navigate = useNavigate();

  const { loading, run: runExitGroup } = useRequest(
    async () => {
      const params: QuitGroupRequest = { groupId: groupId! };
      await groupService.quitGroup(params);
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success('已退出小组');
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
      toast.danger('小组ID不存在');
      return;
    }
    runExitGroup();
  };

  return (
    <AppModal
      type="danger"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="退出小组"
      description="退出小组后，您将无法访问该小组的资源和历史数据，且需要重新邀请才能再次加入。"
      confirmText="确认退出"
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isDismissable={!loading}
    >
      <div className={styles.exitGroupName}>将要退出：{groupName}</div>
    </AppModal>
  );
}

export default ExitGroupModal;
