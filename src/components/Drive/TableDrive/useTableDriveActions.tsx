import {
  NewFolderNodeModal,
  TagPermissionModal,
  UploadFileToGroupModal,
} from '@/components/Drive/Modals';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import type { DriveTableRow, TableDriveActionConfig } from './index.type';

export interface UseTableDriveActionsParams {
  currentNodeId: string;
  currentRows: DriveTableRow[];
  groupId?: string;
  actions?: TableDriveActionConfig;
  refresh: () => void;
}

export interface UseTableDriveActionsReturn {
  showCreateFolder: boolean;
  showUploadToGroup: boolean;
  showManagePermission: boolean;
  openNewFolder: () => void;
  openUploadToGroup: () => void;
  openTagPermission: () => void;
  ModalHost: ReactElement;
}

const DEFAULT_TOOLBAR_CONFIG: Required<NonNullable<TableDriveActionConfig['toolbar']>> = {
  canCreateFolder: true,
  canUploadToGroup: false,
  canManageTagPermission: false,
};

export function useTableDriveActions({
  currentNodeId,
  currentRows,
  groupId,
  actions,
  refresh,
}: UseTableDriveActionsParams): UseTableDriveActionsReturn {
  const toolbarConfig = { ...DEFAULT_TOOLBAR_CONFIG, ...actions?.toolbar };

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tagPermissionOpen, setTagPermissionOpen] = useState(false);
  const [tagPermissionTagId, setTagPermissionTagId] = useState<string>();
  const existingFolderNames = useMemo(
    () => currentRows.filter((row) => row.node.type === 'folder').map((row) => row.name.trim()),
    [currentRows]
  );

  const ModalHost = useMemo(
    () => (
      <>
        {newFolderOpen ? (
          <NewFolderNodeModal
            isOpen={newFolderOpen}
            parentId={currentNodeId}
            groupId={groupId}
            existingFolderNames={existingFolderNames}
            onOpenChange={setNewFolderOpen}
            onSuccess={refresh}
          />
        ) : null}
        {groupId && uploadOpen ? (
          <UploadFileToGroupModal
            isOpen={uploadOpen}
            groupId={groupId}
            onOpenChange={setUploadOpen}
            onSuccess={refresh}
          />
        ) : null}
        {groupId && tagPermissionOpen ? (
          <TagPermissionModal
            isOpen={tagPermissionOpen}
            groupId={groupId}
            initialTagId={tagPermissionTagId}
            onOpenChange={(open) => {
              if (!open) {
                setTagPermissionOpen(false);
                setTagPermissionTagId(undefined);
              }
            }}
            onSuccess={refresh}
          />
        ) : null}
      </>
    ),
    [
      currentNodeId,
      existingFolderNames,
      newFolderOpen,
      groupId,
      uploadOpen,
      tagPermissionOpen,
      tagPermissionTagId,
      refresh,
    ]
  );

  const openNewFolder = useCallback(() => {
    setNewFolderOpen(true);
  }, []);

  const openUploadToGroup = useCallback(() => {
    setUploadOpen(true);
  }, []);

  const openTagPermission = useCallback(() => {
    setTagPermissionTagId(undefined);
    setTagPermissionOpen(true);
  }, []);

  return {
    showCreateFolder: Boolean(toolbarConfig.canCreateFolder),
    showUploadToGroup: Boolean(toolbarConfig.canUploadToGroup && groupId),
    showManagePermission: Boolean(toolbarConfig.canManageTagPermission && groupId),
    openNewFolder,
    openUploadToGroup,
    openTagPermission,
    ModalHost,
  };
}
