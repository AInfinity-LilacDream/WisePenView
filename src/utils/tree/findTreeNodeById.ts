export interface TreeNodeWithId<T> {
  id: string;
  children?: T[];
}

/** 按 id 深度优先查找树节点。 */
export function findTreeNodeById<T extends TreeNodeWithId<T>>(
  nodes: readonly T[],
  id: string
): T | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;

    if (node.children?.length) {
      const child = findTreeNodeById(node.children, id);
      if (child) return child;
    }
  }
  return undefined;
}
