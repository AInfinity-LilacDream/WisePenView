import type { DriveActionTarget } from '../../../common/driveComponentModel';

export interface DeleteNodeModalProps {
  isOpen: boolean;
  node: DriveActionTarget | null;
  groupId?: string;
  isTrashView?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
