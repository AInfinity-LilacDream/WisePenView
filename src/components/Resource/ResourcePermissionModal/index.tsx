import AppModal from '@/components/Overlay/AppModal';
import { Button } from '@heroui/react';
import ResourcePermissionPanel from '../ResourcePermissionPanel';
import type { ResourcePermissionModalProps } from './index.type';
import styles from './style.module.less';

function ResourcePermissionModal({
  isOpen,
  resourceId,
  resourceType,
  onOpenChange,
  onSuccess,
}: ResourcePermissionModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="管理协作者"
      description="所有可访问此资源的用户"
      size="lg"
      bodyClassName={styles.modalBody}
      actions={
        <Button variant="secondary" onPress={() => onOpenChange(false)}>
          关闭
        </Button>
      }
    >
      <AppModal.DeferredContent fallback={<div className={styles.deferredPanel} />}>
        {() => (
          <ResourcePermissionPanel
            resourceId={resourceId}
            resourceType={resourceType}
            onSuccess={onSuccess}
          />
        )}
      </AppModal.DeferredContent>
    </AppModal>
  );
}

export default ResourcePermissionModal;
