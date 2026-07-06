import AppModal from '@/components/AppModal';
import SelectedMemberList from '@/components/SelectedMemberList';
import { useGroupService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { DeleteMemberModalProps } from './index.type';
import { useMemberEditGuard } from './useMemberEditGuard';

function DeleteMemberModal({
  isOpen,
  onOpenChange,
  onSuccess,
  memberIds,
  members,
  groupId,
  groupDisplayConfig,
}: DeleteMemberModalProps) {
  const groupService = useGroupService();
  const { loading, run: runDeleteMembers } = useRequest(
    async () =>
      groupService.kickMembers({
        groupId,
        targetUserIds: memberIds,
      }),
    {
      manual: true,
      onSuccess: () => {
        toast.success(`已删除 ${memberIds.length} 位成员`);
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const { memberContainsOwner, canEdit, confirmDisabled } = useMemberEditGuard(
    members,
    groupDisplayConfig.editableRoles,
    { checkOwner: true }
  );

  const handleConfirm = () => {
    runDeleteMembers();
  };
  const description = memberContainsOwner
    ? '选中成员中有小组创建者，不可删除！'
    : !canEdit
      ? '您不能删除组长/管理员。'
      : '确定要删除以下成员吗？此操作不可撤销！';

  return (
    <AppModal
      type="danger"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="删除成员"
      description={description}
      confirmText="删除"
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isConfirmDisabled={confirmDisabled || loading}
      size="md"
      isDismissable={!loading}
    >
      <SelectedMemberList members={members} />
    </AppModal>
  );
}

export default DeleteMemberModal;
