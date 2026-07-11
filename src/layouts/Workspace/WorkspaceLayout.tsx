import ChatPanel from '@/components/ChatPanel';
import ChatSessionBar from '@/components/ChatPanel/ChatSessionBar';
import type { ChatSession } from '@/domains/Chat';
import DriveSidebar from '@/layouts/_common/Sidebar/DriveSidebar';
import {
  SystemResizableHandle,
  SystemResizablePanel,
  SystemResizablePanelGroup,
} from '@/layouts/_common/SystemResizable';
import { useResizablePanelSize } from '@/layouts/_common/useResizablePanelSize';
import {
  clearNewChatSessionStore,
  useChatPanelStore,
  useCurrentChatSessionStore,
  useSystemLayoutStore,
} from '@/store';
import {
  normalizeWorkspaceResourceType,
  resolveLegacyEditorTypeForWorkspace,
  resolveWorkspaceViewer,
} from '@/utils/navigation/workspaceRoute';
import { useUpdateEffect } from 'ahooks';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  Layout,
  LayoutChangedMeta,
  PanelImperativeHandle,
  PanelSize,
} from 'react-resizable-panels';
import { Outlet, useLocation, useMatch } from 'react-router-dom';
import WorkspaceFrame from './_common/WorkspaceFrame';
import WorkspaceHeader from './_common/WorkspaceHeader';
import styles from './WorkspaceLayout.module.less';
import type { WorkspaceLayoutConfig, WorkspaceOutletContextValue } from './WorkspaceOutletContext';

const WORKSPACE_LEFT_SIDEBAR_MIN_WIDTH = 240;
const WORKSPACE_LEFT_SIDEBAR_MAX_WIDTH = 420;
const WORKSPACE_MAIN_MIN_WIDTH = 360;
const CHAT_PANEL_MIN_WIDTH = 320;
const CHAT_PANEL_MAX_WIDTH = 1020;
const CHAT_SESSION_PANEL_MIN_WIDTH = 240;
const CHAT_SESSION_PANEL_MAX_WIDTH = 420;
const RESIZE_TARGET_MINIMUM_SIZE = { fine: 16, coarse: 32 };

const clampPanelWidth = (width: number, min: number, max: number): number =>
  Math.min(Math.max(Math.round(width), min), max);

const clampWorkspaceLeftSidebarWidth = (width: number): number =>
  clampPanelWidth(width, WORKSPACE_LEFT_SIDEBAR_MIN_WIDTH, WORKSPACE_LEFT_SIDEBAR_MAX_WIDTH);

const clampChatSessionPanelWidth = (width: number): number =>
  clampPanelWidth(width, CHAT_SESSION_PANEL_MIN_WIDTH, CHAT_SESSION_PANEL_MAX_WIDTH);

function WorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layoutConfig, setLayoutConfigState] = useState<WorkspaceLayoutConfig>({});
  const [chatSessionBarOpen, setChatSessionBarOpen] = useState(false);
  const storedLeftSidebarWidth = useSystemLayoutStore((state) => state.workspaceLeftSidebarWidth);
  const storedChatSessionPanelWidth = useSystemLayoutStore(
    (state) => state.workspaceChatSessionPanelWidth
  );
  const setLeftSidebarWidth = useSystemLayoutStore((state) => state.setWorkspaceLeftSidebarWidth);
  const setChatSessionPanelWidth = useSystemLayoutStore(
    (state) => state.setWorkspaceChatSessionPanelWidth
  );
  const leftSidebarPanelRef = useRef<PanelImperativeHandle | null>(null);
  const rightDockPanelRef = useRef<PanelImperativeHandle | null>(null);
  const chatPanelRef = useRef<PanelImperativeHandle | null>(null);
  const chatSessionPanelRef = useRef<PanelImperativeHandle | null>(null);
  const pendingLeftSidebarWidthRef = useRef<number | null>(null);
  const pendingRightDockWidthRef = useRef<number | null>(null);
  const pendingChatPanelWidthRef = useRef<number | null>(null);
  const pendingChatSessionPanelWidthRef = useRef<number | null>(null);
  const leftSidebarWidth = clampWorkspaceLeftSidebarWidth(storedLeftSidebarWidth);
  const chatSessionPanelWidth = clampChatSessionPanelWidth(storedChatSessionPanelWidth);
  const chatPanelCollapsed = useChatPanelStore((state) => state.chatPanelCollapsed);
  const chatPanelDraftOpen = useChatPanelStore((state) => state.chatPanelDraftOpen);
  const chatPanelWidth = useChatPanelStore((state) => state.chatPanelWidth);
  const setChatPanelCollapsed = useChatPanelStore((state) => state.setChatPanelCollapsed);
  const setChatPanelDraftOpen = useChatPanelStore((state) => state.setChatPanelDraftOpen);
  const setChatPanelWidth = useChatPanelStore((state) => state.setChatPanelWidth);
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const setCurrentSession = useCurrentChatSessionStore((state) => state.setCurrentSession);
  const clearCurrentSession = useCurrentChatSessionStore((state) => state.clearCurrentSession);
  const hasSessionId = Boolean(currentSessionId);
  const shouldRenderChatPanel = hasSessionId || chatPanelDraftOpen;
  const safeChatPanelCollapsed = !shouldRenderChatPanel || chatPanelCollapsed;
  const chatPanelOpen = !safeChatPanelCollapsed;
  const chatSessionPanelOpen = chatSessionBarOpen && chatPanelOpen;
  const normalizedChatPanelWidth = clampPanelWidth(
    chatPanelWidth,
    CHAT_PANEL_MIN_WIDTH,
    CHAT_PANEL_MAX_WIDTH
  );
  const sidebarPanelSize = sidebarCollapsed ? 0 : leftSidebarWidth;
  const chatPanelSize = chatPanelOpen ? normalizedChatPanelWidth : 0;
  const chatSessionPanelSize = chatSessionPanelOpen ? chatSessionPanelWidth : 0;
  const rightDockPanelSize = chatPanelOpen ? chatPanelSize + chatSessionPanelSize : 0;
  const rightDockPanelMinWidth = chatPanelOpen
    ? CHAT_PANEL_MIN_WIDTH + (chatSessionPanelOpen ? CHAT_SESSION_PANEL_MIN_WIDTH : 0)
    : 0;
  const rightDockPanelMaxWidth = chatPanelOpen
    ? CHAT_PANEL_MAX_WIDTH + (chatSessionPanelOpen ? CHAT_SESSION_PANEL_MAX_WIDTH : 0)
    : 0;
  const location = useLocation();
  const resourceRouteMatch = useMatch('/app/workspace/:resourceType/:resourceId');
  const resourceListRouteMatch = useMatch('/app/workspace/:resourceType');
  const routeContext = useMemo(() => {
    const rawResourceType =
      resourceRouteMatch?.params.resourceType ?? resourceListRouteMatch?.params.resourceType;
    const resourceId = resourceRouteMatch?.params.resourceId;
    const resourceType = normalizeWorkspaceResourceType(rawResourceType);
    const viewer = resolveWorkspaceViewer({
      resourceType: rawResourceType,
      viewer: new URLSearchParams(location.search).get('viewer') ?? undefined,
    });

    return {
      resourceId,
      resourceType,
      viewer,
    };
  }, [
    location.search,
    resourceListRouteMatch?.params.resourceType,
    resourceRouteMatch?.params.resourceId,
    resourceRouteMatch?.params.resourceType,
  ]);
  const routeChatContext = useMemo(() => {
    const { resourceId, resourceType, viewer } = routeContext;
    if (!resourceId || !resourceType) return undefined;
    return {
      resourceId,
      resourceType,
      viewer,
      editorType: resolveLegacyEditorTypeForWorkspace(resourceType, viewer),
    };
  }, [routeContext]);
  const chatWorkspaceContext = layoutConfig.chatContext ?? routeChatContext;

  useResizablePanelSize({
    panelRef: leftSidebarPanelRef,
    size: sidebarPanelSize,
  });

  useResizablePanelSize({
    panelRef: rightDockPanelRef,
    size: rightDockPanelSize,
  });

  useResizablePanelSize({
    panelRef: chatPanelRef,
    size: chatPanelSize,
  });

  useResizablePanelSize({
    panelRef: chatSessionPanelRef,
    size: chatSessionPanelSize,
  });

  useUpdateEffect(() => {
    if (shouldRenderChatPanel) {
      setChatPanelCollapsed(false);
      return;
    }
    setChatPanelCollapsed(true);
  }, [setChatPanelCollapsed, shouldRenderChatPanel]);

  useUpdateEffect(() => {
    if (!hasSessionId && !chatPanelDraftOpen) return;
    if (hasSessionId) {
      setChatPanelDraftOpen(false);
    }
  }, [chatPanelDraftOpen, hasSessionId, setChatPanelDraftOpen]);

  useUpdateEffect(() => {
    if (!safeChatPanelCollapsed) return;
    setChatSessionBarOpen(false);
  }, [safeChatPanelCollapsed]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((collapsed) => {
      if (!collapsed) {
        const currentWidth = leftSidebarPanelRef.current?.getSize().inPixels;
        if (currentWidth != null) {
          const nextSidebarWidth = clampWorkspaceLeftSidebarWidth(currentWidth);
          if (
            nextSidebarWidth > WORKSPACE_LEFT_SIDEBAR_MIN_WIDTH ||
            leftSidebarWidth === WORKSPACE_LEFT_SIDEBAR_MIN_WIDTH
          ) {
            setLeftSidebarWidth(nextSidebarWidth);
          }
        }
      }
      return !collapsed;
    });
  }, [leftSidebarWidth, setLeftSidebarWidth]);

  const handleChatPanelToggle = useCallback(() => {
    if (safeChatPanelCollapsed) {
      if (!hasSessionId) {
        setChatPanelDraftOpen(true);
      }
      setChatPanelCollapsed(false);
      return;
    }

    setChatSessionBarOpen(false);
    setChatPanelCollapsed(true);
    if (!hasSessionId) {
      setChatPanelDraftOpen(false);
    }
  }, [hasSessionId, safeChatPanelCollapsed, setChatPanelCollapsed, setChatPanelDraftOpen]);

  const handleNewChat = useCallback(() => {
    setChatSessionBarOpen(false);
    clearCurrentSession();
    clearNewChatSessionStore();
    setChatPanelDraftOpen(true);
    setChatPanelCollapsed(false);
  }, [clearCurrentSession, setChatPanelCollapsed, setChatPanelDraftOpen]);

  const handleToggleChatSessionBar = useCallback(() => {
    if (safeChatPanelCollapsed) return;
    setChatSessionBarOpen((open) => !open);
  }, [safeChatPanelCollapsed]);

  const handleCloseChatSessionBar = useCallback(() => {
    setChatSessionBarOpen(false);
  }, []);

  const handleLeftSidebarResize = useCallback(
    (panelSize: PanelSize) => {
      if (sidebarCollapsed) return;
      pendingLeftSidebarWidthRef.current = clampWorkspaceLeftSidebarWidth(panelSize.inPixels);
    },
    [sidebarCollapsed]
  );

  const handleChatPanelResize = useCallback(
    (panelSize: PanelSize) => {
      if (!chatPanelOpen) return;
      pendingChatPanelWidthRef.current = clampPanelWidth(
        panelSize.inPixels,
        CHAT_PANEL_MIN_WIDTH,
        CHAT_PANEL_MAX_WIDTH
      );
    },
    [chatPanelOpen]
  );

  const handleRightDockResize = useCallback(
    (panelSize: PanelSize) => {
      if (!chatPanelOpen) return;
      pendingRightDockWidthRef.current = panelSize.inPixels;
    },
    [chatPanelOpen]
  );

  const handleChatSessionPanelResize = useCallback(
    (panelSize: PanelSize) => {
      if (!chatSessionPanelOpen) return;
      pendingChatSessionPanelWidthRef.current = clampChatSessionPanelWidth(panelSize.inPixels);
    },
    [chatSessionPanelOpen]
  );

  const handleWorkspaceShellLayoutChanged = useCallback(
    (_layout: Layout, meta: LayoutChangedMeta) => {
      const pendingLeftSidebarWidth = pendingLeftSidebarWidthRef.current;
      pendingLeftSidebarWidthRef.current = null;
      if (!meta.isUserInteraction) return;
      if (!sidebarCollapsed && pendingLeftSidebarWidth != null) {
        setLeftSidebarWidth(pendingLeftSidebarWidth);
      }
    },
    [setLeftSidebarWidth, sidebarCollapsed]
  );

  const handleWorkspaceContentLayoutChanged = useCallback(
    (_layout: Layout, meta: LayoutChangedMeta) => {
      const pendingRightDockWidth = pendingRightDockWidthRef.current;
      pendingRightDockWidthRef.current = null;
      pendingChatPanelWidthRef.current = null;
      pendingChatSessionPanelWidthRef.current = null;
      if (!meta.isUserInteraction) return;
      if (chatPanelOpen && pendingRightDockWidth != null) {
        const nextChatPanelWidth = pendingRightDockWidth - chatSessionPanelSize;
        setChatPanelWidth(
          clampPanelWidth(nextChatPanelWidth, CHAT_PANEL_MIN_WIDTH, CHAT_PANEL_MAX_WIDTH)
        );
      }
    },
    [chatPanelOpen, chatSessionPanelSize, setChatPanelWidth]
  );

  const handleWorkspaceRightDockLayoutChanged = useCallback(
    (_layout: Layout, meta: LayoutChangedMeta) => {
      const pendingChatPanelWidth = pendingChatPanelWidthRef.current;
      const pendingChatSessionPanelWidth = pendingChatSessionPanelWidthRef.current;
      pendingChatPanelWidthRef.current = null;
      pendingChatSessionPanelWidthRef.current = null;
      if (!meta.isUserInteraction) return;
      if (chatPanelOpen && pendingChatPanelWidth != null) {
        setChatPanelWidth(pendingChatPanelWidth);
      }
      if (chatSessionPanelOpen && pendingChatSessionPanelWidth != null) {
        setChatSessionPanelWidth(pendingChatSessionPanelWidth);
      }
    },
    [chatPanelOpen, chatSessionPanelOpen, setChatPanelWidth, setChatSessionPanelWidth]
  );

  const handleSelectChatSession = useCallback(
    (session: ChatSession) => {
      setCurrentSession({ id: session.id, title: session.title });
      clearNewChatSessionStore();
      setChatPanelDraftOpen(false);
      setChatPanelCollapsed(false);
      setChatSessionBarOpen(false);
    },
    [setChatPanelCollapsed, setChatPanelDraftOpen, setCurrentSession]
  );

  const setLayoutConfig = useCallback((config: WorkspaceLayoutConfig) => {
    setLayoutConfigState(config);
  }, []);

  const resetLayoutConfig = useCallback(() => {
    setLayoutConfigState({});
  }, []);

  const outletContext = useMemo<WorkspaceOutletContextValue>(
    () => ({
      routeContext,
      setLayoutConfig,
      resetLayoutConfig,
    }),
    [resetLayoutConfig, routeContext, setLayoutConfig]
  );

  const renderHeader = () => {
    if (layoutConfig.header === false) return null;

    return (
      <WorkspaceHeader
        {...(layoutConfig.header ?? {})}
        leftSidebarCollapsed={sidebarCollapsed}
        rightSidebarCollapsed={safeChatPanelCollapsed}
        onToggleLeftSidebar={handleSidebarToggle}
        onToggleRightSidebar={handleChatPanelToggle}
      />
    );
  };

  return (
    <SystemResizablePanelGroup
      orientation="horizontal"
      className={styles.root}
      resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
      onLayoutChanged={handleWorkspaceShellLayoutChanged}
    >
      <SystemResizablePanel
        id="workspace-left-sidebar"
        panelRef={leftSidebarPanelRef}
        defaultSize={sidebarPanelSize}
        minSize={sidebarCollapsed ? 0 : WORKSPACE_LEFT_SIDEBAR_MIN_WIDTH}
        maxSize={sidebarCollapsed ? 0 : WORKSPACE_LEFT_SIDEBAR_MAX_WIDTH}
        groupResizeBehavior="preserve-pixel-size"
        className={clsx(styles.leftSider, sidebarCollapsed && styles.leftSiderCollapsed)}
        aria-label="资源侧边栏"
        aria-hidden={sidebarCollapsed ? true : undefined}
        onResize={handleLeftSidebarResize}
      >
        <DriveSidebar collapsed={sidebarCollapsed} />
      </SystemResizablePanel>

      <SystemResizableHandle
        className={clsx(styles.resizeHandle, sidebarCollapsed && styles.resizeHandleCollapsed)}
        disabled={sidebarCollapsed}
      />

      <SystemResizablePanel
        id="workspace-area"
        minSize={WORKSPACE_MAIN_MIN_WIDTH}
        className={styles.workspaceArea}
      >
        <SystemResizablePanelGroup
          orientation="horizontal"
          className={styles.workspaceInnerGroup}
          resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
          onLayoutChanged={handleWorkspaceContentLayoutChanged}
        >
          <SystemResizablePanel
            id="workspace-main"
            minSize={WORKSPACE_MAIN_MIN_WIDTH}
            className={styles.middleLayout}
          >
            <main className={`${styles.middleContent} ${styles.workspaceContent}`}>
              <WorkspaceFrame
                className={layoutConfig.className}
                bodyClassName={layoutConfig.bodyClassName}
                header={renderHeader()}
              >
                <Outlet context={outletContext} />
              </WorkspaceFrame>
            </main>
          </SystemResizablePanel>

          <SystemResizableHandle
            className={clsx(styles.resizeHandle, !chatPanelOpen && styles.resizeHandleCollapsed)}
            disabled={!chatPanelOpen}
          />

          <SystemResizablePanel
            id="workspace-right-dock"
            panelRef={rightDockPanelRef}
            defaultSize={rightDockPanelSize}
            minSize={rightDockPanelMinWidth}
            maxSize={rightDockPanelMaxWidth}
            groupResizeBehavior="preserve-pixel-size"
            className={styles.rightDock}
            aria-label="右侧工作区"
            aria-hidden={!chatPanelOpen ? true : undefined}
            onResize={handleRightDockResize}
          >
            {chatPanelOpen ? (
              <SystemResizablePanelGroup
                orientation="horizontal"
                className={styles.rightDockGroup}
                resizeTargetMinimumSize={RESIZE_TARGET_MINIMUM_SIZE}
                onLayoutChanged={handleWorkspaceRightDockLayoutChanged}
              >
                <SystemResizablePanel
                  id="workspace-chat"
                  panelRef={chatPanelRef}
                  defaultSize={chatPanelSize}
                  minSize={CHAT_PANEL_MIN_WIDTH}
                  maxSize={CHAT_PANEL_MAX_WIDTH}
                  className={styles.rightSider}
                  aria-label="聊天面板"
                  onResize={handleChatPanelResize}
                >
                  <ChatPanel
                    collapsed={false}
                    onNewChat={handleNewChat}
                    sessionBarOpen={chatSessionBarOpen}
                    onToggleSessionBar={handleToggleChatSessionBar}
                    workspaceContext={chatWorkspaceContext}
                    showCollapseButton={false}
                  />
                </SystemResizablePanel>

                <SystemResizableHandle
                  className={clsx(
                    styles.resizeHandle,
                    !chatSessionPanelOpen && styles.resizeHandleCollapsed
                  )}
                  disabled={!chatSessionPanelOpen}
                />

                <SystemResizablePanel
                  id="workspace-chat-session"
                  panelRef={chatSessionPanelRef}
                  defaultSize={chatSessionPanelSize}
                  minSize={chatSessionPanelOpen ? CHAT_SESSION_PANEL_MIN_WIDTH : 0}
                  maxSize={chatSessionPanelOpen ? CHAT_SESSION_PANEL_MAX_WIDTH : 0}
                  groupResizeBehavior="preserve-pixel-size"
                  className={styles.sessionPanel}
                  aria-label="聊天会话列表"
                  aria-hidden={!chatSessionPanelOpen ? true : undefined}
                  onResize={handleChatSessionPanelResize}
                >
                  {chatSessionPanelOpen ? (
                    <ChatSessionBar
                      activeSessionId={currentSessionId}
                      onClose={handleCloseChatSessionBar}
                      onSelectSession={handleSelectChatSession}
                    />
                  ) : null}
                </SystemResizablePanel>
              </SystemResizablePanelGroup>
            ) : null}
          </SystemResizablePanel>
        </SystemResizablePanelGroup>
      </SystemResizablePanel>
    </SystemResizablePanelGroup>
  );
}

export default WorkspaceLayout;
