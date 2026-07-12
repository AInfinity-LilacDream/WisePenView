import type { ResourceIconType, ResourcePermissionResourceType } from '@/domains/Resource';
import type { ReactNode } from 'react';

export interface ResourceHeaderDownloadAction {
  label: string;
  onAction: () => void;
}

export interface ResourceHeaderMoreMenu {
  advanced?: ReactNode;
  showCommentHistory?: boolean;
  onCommentHistory?: () => void;
  onPrint?: () => void;
  download?: ResourceHeaderDownloadAction;
  isPending?: boolean;
}

export interface ResourceHeaderProps {
  resourceId?: string;
  resourceName: string;
  resourceType?: string;
  resourceIconType?: ResourceIconType;
  permissionResourceType: ResourcePermissionResourceType;
  ownerId?: string | null;
  onPermissionSuccess?: () => void;
  isDisabled?: boolean;
  titleMeta?: ReactNode;
  leadingActions?: ReactNode;
  actions?: ReactNode;
  moreMenu?: ResourceHeaderMoreMenu;
}
