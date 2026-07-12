import DriveNavigator from '@/components/Drive/DriveNavigator';
import type { DriveSelectionItem } from '@/components/Drive/common/driveComponentModel';
import AppModal from '@/components/Overlay/AppModal';
import { Button } from '@heroui/react';
import { useState } from 'react';
import { useChatInputStore, useChatInputStoreApi } from '../_store/ChatInputStore';
import type { LocalResourcePayload } from '../index.type';
import styles from './style.module.less';

function mapDriveSelectionToDocRef(item: DriveSelectionItem): LocalResourcePayload | null {
  if ((item.kind !== 'resource' && item.kind !== 'link') || !item.resourceId) return null;
  return {
    resourceId: item.resourceId,
    resourceName: item.label || item.resourceId,
    resourceType: item.resourceType ?? '',
    enabled: true,
  };
}

function DocumentPickerContent() {
  const { addDocRefs, setDocumentPickerOpen } = useChatInputStoreApi().getState();
  const [selectedResources, setSelectedResources] = useState<LocalResourcePayload[]>([]);

  function handleSelectionChange(items: DriveSelectionItem[]): void {
    setSelectedResources(
      items
        .map((item) => mapDriveSelectionToDocRef(item))
        .filter((item): item is LocalResourcePayload => item != null)
    );
  }

  function handleClose(): void {
    setSelectedResources([]);
    setDocumentPickerOpen(false);
  }

  function handleConfirm(): void {
    addDocRefs(selectedResources);
    handleClose();
  }

  return (
    <>
      <AppModal.Body>
        <div className={styles.wrapper}>
          <div className={styles.treeSection}>
            <div className={styles.hint}>选择要引用的文档（可多选）</div>
            <div className={styles.navTree}>
              <DriveNavigator
                scopeMode="all"
                renderableTypes={['root', 'folder', 'resource', 'link']}
                selectableTypes={['resource', 'link']}
                multiple
                onChange={handleSelectionChange}
              />
            </div>
          </div>
        </div>
      </AppModal.Body>
      <AppModal.Footer>
        <Button variant="secondary" onPress={handleClose}>
          取消
        </Button>
        <Button
          variant="primary"
          onPress={handleConfirm}
          isDisabled={selectedResources.length === 0}
        >
          确定
        </Button>
      </AppModal.Footer>
    </>
  );
}

function DocumentPickerModal() {
  const open = useChatInputStore((state) => state.documentPickerOpen);
  const { setDocumentPickerOpen } = useChatInputStoreApi().getState();

  function handleOpenChange(visible: boolean): void {
    if (visible) return;
    setDocumentPickerOpen(false);
  }

  return (
    <AppModal
      isOpen={open}
      onOpenChange={handleOpenChange}
      title="从云盘选取"
      size="md"
      contentMode="dialog"
    >
      <AppModal.DeferredContent
        fallback={
          <>
            <AppModal.Body>
              <div className={styles.wrapper}>
                <div className={styles.treeSection}>
                  <div className={styles.hint}>选择要引用的文档（可多选）</div>
                  <div className={styles.navTree} />
                </div>
              </div>
            </AppModal.Body>
            <AppModal.Footer>
              <Button variant="secondary" onPress={() => setDocumentPickerOpen(false)}>
                取消
              </Button>
              <Button variant="primary" isDisabled>
                确定
              </Button>
            </AppModal.Footer>
          </>
        }
      >
        {() => <DocumentPickerContent />}
      </AppModal.DeferredContent>
    </AppModal>
  );
}

export default DocumentPickerModal;
