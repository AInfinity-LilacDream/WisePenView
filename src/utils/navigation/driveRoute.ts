import { buildDriveNodeScope, type DriveNodeScope } from '@/domains/Drive';

const APP_DRIVE_PATH = '/app/drive';
const APP_GROUP_PATH = '/app/my-group';

export interface DriveRouteLocation {
  scope: DriveNodeScope;
  initialNodeId?: string;
}

export const buildDrivePath = ({
  scope,
  nodeId,
}: {
  scope: DriveNodeScope;
  nodeId?: string;
}): string => {
  const search = new URLSearchParams();
  if (nodeId && nodeId !== scope.rootId) {
    search.set('folder', nodeId);
  }

  const basePath =
    scope.type === 'group'
      ? `${APP_GROUP_PATH}/${encodeURIComponent(scope.groupId)}`
      : APP_DRIVE_PATH;
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
};

export const parseDriveInitialNodeId = (search: string): string | undefined => {
  return new URLSearchParams(search).get('folder')?.trim() || undefined;
};

export const parseDriveRouteLocation = (search: string): DriveRouteLocation => {
  const initialNodeId = parseDriveInitialNodeId(search);

  return {
    scope: buildDriveNodeScope(),
    ...(initialNodeId ? { initialNodeId } : {}),
  };
};
