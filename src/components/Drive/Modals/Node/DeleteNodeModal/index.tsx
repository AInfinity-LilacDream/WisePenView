import { clearNewNoteStore } from '@/components/Note/_store/useNewNoteStore';
import AppAlertDialog from '@/components/Overlay/AppAlertDialog';
import { removePdfPreviewProgress } from '@/components/PdfViewer/_store/usePdfPreviewProgressStore';
import { useDriveService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { DeleteNodeModalProps } from './index.type';

function getNodeName(node: DeleteNodeModalProps['node']): string {
  if (!node) return '未命名';
  if (node.type === 'folder') return node.name;
  return node.title;
}

function DeleteNodeModal({
  isOpen,
  node,
  groupId,
  isTrashView = false,
  onOpenChange,
  onSuccess,
}: DeleteNodeModalProps) {
  const driveService = useDriveService();
  const isGroupNode = Boolean(groupId && node);
  const isGroupResource = Boolean(groupId && node && node.type !== 'folder');
  const isPermanentDelete = Boolean(!groupId && isTrashView);

  const { loading, run: runDeleteNode } = useRequest(
    async () => {
      if (!node) return;
      await driveService.removeNode({ nodeId: node.id, groupId });
    },
    {
      manual: true,
      onSuccess: () => {
        if (isPermanentDelete) {
          if (node?.type === 'folder') {
            clearNewNoteStore();
          } else if (node) {
            clearNewNoteStore(node.resourceId);
            removePdfPreviewProgress(node.resourceId);
          }
        }
        toast.success(
          isGroupNode ? '已从小组移除' : isPermanentDelete ? '已彻底删除' : '已移入最近删除'
        );
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleConfirm = () => {
    if (!node) return;
    runDeleteNode();
  };

  const isFolder = node?.type === 'folder';
  const isPrimaryGroupMount = Boolean(groupId && node?.type === 'resource');
  const nodeName = getNodeName(node);
  const title = isGroupNode ? '从小组移除' : isPermanentDelete ? '彻底删除' : '移入最近删除';
  const description = (() => {
    if (isPermanentDelete && isFolder) {
      return `确定彻底删除「${nodeName}」及其下属内容吗？此操作不可撤销。`;
    }
    if (isPermanentDelete) {
      return `确定彻底删除「${nodeName}」吗？此操作不可撤销。`;
    }
    if (groupId && isFolder) {
      return `确定从当前小组移除「${nodeName}」及其下属内容的挂载吗？`;
    }
    if (isPrimaryGroupMount) {
      return `「${nodeName}」是当前小组的主挂载文件，移除后会同时解除它在当前小组下的全部挂载关系。确定继续吗？`;
    }
    if (isGroupResource) {
      return `确定从当前小组文件夹移除「${nodeName}」的挂载吗？`;
    }
    if (isFolder) {
      return `确定将「${nodeName}」及其下属内容移入最近删除吗？`;
    }
    return `确定将「${nodeName}」移入最近删除吗？`;
  })();
  const confirmText = isGroupNode ? '移除' : isPermanentDelete ? '彻底删除' : '移入最近删除';

  return (
    <AppAlertDialog
      type="danger"
      isOpen={isOpen && !!node}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={confirmText}
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isDismissable={!loading}
    />
  );
}

export default DeleteNodeModal;
