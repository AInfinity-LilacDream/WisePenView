import type { DriveActionTarget } from '../../../common/driveComponentModel';

export interface MoveNodeModalProps {
  isOpen: boolean;
  node: DriveActionTarget | null;
  rootId: string;
  groupId?: string;
  isTrashView?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (targetFolderNodeId: string) => void;
}
