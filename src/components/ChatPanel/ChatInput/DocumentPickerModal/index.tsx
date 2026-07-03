import { EmptyState, LoadingState } from '@/components/Feedback';
import type { DataNode } from '@/components/Tree';
import Tree from '@/components/Tree';
import { useChatService } from '@/domains';
import type { ChatDocumentPickerNode, ChatDocumentPickerScope } from '@/domains/Chat';
import { parseErrorMessage } from '@/utils/error';
import { Modal } from '@/components/Overlay';
import { Button, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import { Folder, Users } from 'lucide-react';
import type { Key } from 'react';
import { useRef, useState } from 'react';
import { useChatInputStore, useChatInputStoreApi } from '../ChatInputStore';
import styles from './style.module.less';

const CHILD_KEY_SEPARATOR = '>';

function isScopeRootKey(key: string): boolean {
  return !key.includes(CHILD_KEY_SEPARATOR);
}

function buildScopedKey(scopeKey: string, nodeId: string): string {
  return `${scopeKey}${CHILD_KEY_SEPARATOR}${nodeId}`;
}

function parseDocumentTreeKey(key: string): { scopeKey: string; nodeId: string } | null {
  const idx = key.indexOf(CHILD_KEY_SEPARATOR);
  if (idx === -1) return null;
  return {
    scopeKey: key.slice(0, idx),
    nodeId: key.slice(idx + CHILD_KEY_SEPARATOR.length),
  };
}

function buildScopeRootNode(scope: ChatDocumentPickerScope): DataNode {
  const icon =
    scope.type === 'personal' ? (
      <Folder size={14} color="var(--warning)" />
    ) : (
      <Users size={14} color="var(--accent)" />
    );

  return {
    key: scope.scopeKey,
    title: (
      <span className={styles.scopeTitle}>
        <span className={styles.scopeIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.scopeLabel}>{scope.label}</span>
      </span>
    ),
    isLeaf: false,
    selectable: false,
    checkable: false,
  };
}

function isSelectableDocumentNode(node: ChatDocumentPickerNode | undefined): boolean {
  if (!node) return false;
  if (node.selectable) return true;
  return node.type === 'resource' || node.type === 'link';
}

function isExpandableDocumentNode(node: ChatDocumentPickerNode | undefined): boolean {
  if (!node) return false;
  if (node.isLeaf) return false;
  return node.type === 'root' || node.type === 'folder';
}

function replaceTreeNodeChildren(
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
      children: replaceTreeNodeChildren(node.children, targetKey, children),
    };
  });
}

function DocumentPickerContent() {
  const chatService = useChatService();
  const { addDocRefs, setDocumentPickerOpen } = useChatInputStoreApi().getState();
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const scopeMapRef = useRef<Map<string, ChatDocumentPickerScope>>(new Map());
  const documentNodeMapRef = useRef<Map<string, ChatDocumentPickerNode>>(new Map());

  function buildDocumentTreeNodes(
    scopeKey: string,
    documentNodes: ChatDocumentPickerNode[]
  ): DataNode[] {
    return documentNodes.map((node) => {
      const key = buildScopedKey(scopeKey, node.nodeId);
      const selectable = isSelectableDocumentNode(node);
      documentNodeMapRef.current.set(key, node);
      return {
        key,
        title: node.title,
        isLeaf: node.isLeaf,
        selectable,
        checkable: selectable,
      };
    });
  }

  async function loadChildren(
    scope: ChatDocumentPickerScope,
    targetKey: string,
    parentNodeId?: string
  ): Promise<void> {
    try {
      const children = await chatService.listDocumentPickerChildren({
        rootId: scope.rootId,
        groupId: scope.groupId,
        parentNodeId,
      });
      setTreeData((prev) =>
        replaceTreeNodeChildren(prev, targetKey, buildDocumentTreeNodes(scope.scopeKey, children))
      );
    } catch (err) {
      toast.danger(parseErrorMessage(err));
    }
  }

  const { loading: loadingScopes } = useRequest(async () => {
    scopeMapRef.current.clear();
    documentNodeMapRef.current.clear();
    setCheckedKeys([]);

    try {
      const scopes = await chatService.getDocumentPickerScopes();
      scopes.forEach((scope) => scopeMapRef.current.set(scope.scopeKey, scope));
      setTreeData(scopes.map(buildScopeRootNode));
    } catch (err) {
      toast.danger(parseErrorMessage(err));
      setTreeData([]);
    }
  });

  async function handleLoadData(treeNode: DataNode): Promise<void> {
    const key = String(treeNode.key);
    if (treeNode.children) return;

    if (isScopeRootKey(key)) {
      const scope = scopeMapRef.current.get(key);
      if (scope) await loadChildren(scope, key);
      return;
    }

    const parsed = parseDocumentTreeKey(key);
    if (!parsed) return;
    const scope = scopeMapRef.current.get(parsed.scopeKey);
    const documentNode = documentNodeMapRef.current.get(key);
    if (!scope || !isExpandableDocumentNode(documentNode)) return;
    await loadChildren(scope, key, parsed.nodeId);
  }

  function normalizeSelectableKeys(keys: string[]): string[] {
    return keys.filter((key) => isSelectableDocumentNode(documentNodeMapRef.current.get(key)));
  }

  function handleSelect(_keys: Key[], info: { node: DataNode; selected: boolean }): void {
    const clickedKey = String(info.node.key);
    if (!isSelectableDocumentNode(documentNodeMapRef.current.get(clickedKey))) return;

    setCheckedKeys((prev) => {
      const next = prev.includes(clickedKey)
        ? prev.filter((key) => key !== clickedKey)
        : [...prev, clickedKey];
      return normalizeSelectableKeys(next);
    });
  }

  function handleCheck(checked: Key[] | { checked: Key[]; halfChecked: Key[] }): void {
    const keys = Array.isArray(checked) ? checked.map(String) : checked.checked.map(String);
    setCheckedKeys(normalizeSelectableKeys(keys));
  }

  function resetModalState(): void {
    scopeMapRef.current.clear();
    documentNodeMapRef.current.clear();
    setTreeData([]);
    setCheckedKeys([]);
  }

  function handleClose(): void {
    resetModalState();
    setDocumentPickerOpen(false);
  }

  function handleConfirm(): void {
    const resources = checkedKeys
      .map((key) => documentNodeMapRef.current.get(key))
      .filter((node): node is ChatDocumentPickerNode =>
        Boolean(node && isSelectableDocumentNode(node) && node.resourceId)
      )
      .map((node) => ({
        resourceId: node.resourceId!,
        resourceName: node.resourceName || node.title || node.resourceId!,
        resourceType: node.resourceType ?? '',
        enabled: true,
      }));

    addDocRefs(resources);
    handleClose();
  }

  return (
    <>
      <Modal.Body>
        <div className={styles.wrapper}>
          <div className={styles.treeSection}>
            <div className={styles.hint}>选择要引用的文档（可多选）</div>
            <div className={styles.navTree}>
              {loadingScopes && treeData.length === 0 ? (
                <div className={styles.emptyState}>
                  <LoadingState />
                </div>
              ) : treeData.length === 0 ? (
                <div className={styles.emptyState}>
                  <EmptyState title="暂无可选文档" />
                </div>
              ) : (
                <Tree
                  className={styles.tree}
                  treeData={treeData}
                  blockNode
                  checkable
                  checkStrictly
                  selectable
                  multiple
                  selectedKeys={[]}
                  checkedKeys={checkedKeys}
                  onSelect={handleSelect}
                  onCheck={handleCheck}
                  loadData={handleLoadData}
                />
              )}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onPress={handleClose}>
          取消
        </Button>
        <Button variant="primary" onPress={handleConfirm} isDisabled={checkedKeys.length === 0}>
          确定
        </Button>
      </Modal.Footer>
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
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>从云盘选取</Modal.Heading>
            </Modal.Header>
            <Modal.DeferredContent
              fallback={
                <>
                  <Modal.Body>
                    <div className={styles.wrapper}>
                      <div className={styles.treeSection}>
                        <div className={styles.hint}>选择要引用的文档（可多选）</div>
                        <div className={styles.navTree} />
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onPress={() => setDocumentPickerOpen(false)}>
                      取消
                    </Button>
                    <Button variant="primary" isDisabled>
                      确定
                    </Button>
                  </Modal.Footer>
                </>
              }
            >
              {() => <DocumentPickerContent />}
            </Modal.DeferredContent>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default DocumentPickerModal;
