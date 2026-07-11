import type { DriveNode } from '@/domains/Drive';
import type { DriveItemKind, DriveScope, DriveSelectionItem } from '../common/driveComponentModel';

export type DriveNavigatorScopeMode = 'single' | 'all';

export interface DriveNavigatorProps {
  rootId?: string;
  scope?: DriveScope;
  groupId?: string;
  scopeMode?: DriveNavigatorScopeMode;
  renderableTypes?: DriveItemKind[];
  selectableTypes?: DriveItemKind[];
  disabledNodeIds?: string[];
  multiple?: boolean;
  initialSelectedIds?: string[];
  refreshTrigger?: number;
  isNodeSelectable?: (node: DriveNode) => boolean;
  isNodeDisabled?: (node: DriveNode) => boolean;
  onChange?: (selected: DriveSelectionItem[]) => void;
  onNodeChange?: (selected: DriveNode[]) => void;
}
