import AppAlertDialog from '@/components/AppAlertDialog';
import { useGroupService } from '@/domains';
import type { DeleteGroupRequest } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import type { DissolveGroupModalProps } from './index.type';

function DissolveGroupModal({
  isOpen,
  onOpenChange,
  groupName,
  groupId,
  onSuccess,
}: DissolveGroupModalProps) {
  const groupService = useGroupService();
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

  return (
    <AppAlertDialog
      type="danger"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="解散小组"
      description={`确定要解散小组「${groupName}」吗？此操作不可撤销！`}
      confirmText="解散"
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isDismissable={!loading}
    />
  );
}

export default DissolveGroupModal;
