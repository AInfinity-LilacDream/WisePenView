import type { DataNode } from '@/components/Tree';
import type { DriveNode } from '@/domains/Drive';
import type { ReactNode } from 'react';
import type { DriveItemKind } from './driveComponentModel';

interface BuildDriveTreeDataOptions {
  renderableTypes: Set<DriveItemKind>;
  selectableTypes: Set<DriveItemKind>;
  disabledNodeIds: Set<string>;
  getTreeKey: (node: DriveNode) => string;
  renderTitle: (node: DriveNode) => ReactNode;
  isNodeSelectable?: (node: DriveNode) => boolean;
  isNodeDisabled?: (node: DriveNode) => boolean;
}

export function buildDriveTreeData(
  nodes: DriveNode[],
  options: BuildDriveTreeDataOptions,
  nodeMap: Map<string, DriveNode>
): DataNode[] {
  const result: DataNode[] = [];
  for (const node of nodes) {
    if (node.type !== 'loading' && !options.renderableTypes.has(node.type)) continue;
    const key = options.getTreeKey(node);
    nodeMap.set(key, node);
    result.push(toTreeDataNode(node, key, options));
  }
  return result;
}

export function replaceDriveTreeNodeChildren(
  nodes: DataNode[],
  targetKey: string,
  children: DataNode[]
): DataNode[] {
  return nodes.map((node) => {
    if (String(node.key) === targetKey) {
      return { ...node, children };
    }
    if (!node.children || node.children.length === 0) return node;
    return {
      ...node,
      children: replaceDriveTreeNodeChildren(node.children, targetKey, children),
    };
  });
}

function resolveNodeState(node: DriveNode, options: BuildDriveTreeDataOptions) {
  if (node.type === 'loading') {
    return {
      disabled: false,
      selectable: false,
    };
  }

  const disabled = options.disabledNodeIds.has(node.id) || options.isNodeDisabled?.(node) === true;
  const selectable =
    options.selectableTypes.has(node.type) && (options.isNodeSelectable?.(node) ?? true);

  return {
    disabled,
    selectable,
  };
}

function toTreeDataNode(
  node: DriveNode,
  key: string,
  options: BuildDriveTreeDataOptions
): DataNode {
  const title = options.renderTitle(node);

  if (node.type === 'loading') {
    return {
      key,
      title,
      selectable: false,
      checkable: false,
      isLeaf: true,
    };
  }

  const { disabled, selectable } = resolveNodeState(node, options);

  if (node.type === 'root' || node.type === 'folder') {
    return {
      key,
      title,
      selectable: selectable && !disabled,
      checkable: false,
      disabled,
      isLeaf: false,
    };
  }

  return {
    key,
    title,
    selectable: selectable && !disabled,
    checkable: false,
    disabled,
    isLeaf: true,
  };
}
