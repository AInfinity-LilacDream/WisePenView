import ChatPanel from '@/components/ChatPanel';
import AppSidebar from '@/layouts/_common/Sidebar/AppSidebar';
import { useChatPanelResize } from '@/layouts/_common/useChatPanelResize';
import { useChatPanelStore, useCurrentChatSessionStore } from '@/store';
import { useUpdateEffect } from 'ahooks';
import clsx from 'clsx';
import { Bot } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './AppLayout.module.less';

function AppLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isChatPage = location.pathname.startsWith('/app/chat');
  const chatPanelCollapsed = useChatPanelStore((state) => state.chatPanelCollapsed);
  const chatPanelDraftOpen = useChatPanelStore((state) => state.chatPanelDraftOpen);
  const setChatPanelCollapsed = useChatPanelStore((state) => state.setChatPanelCollapsed);
  const setChatPanelDraftOpen = useChatPanelStore((state) => state.setChatPanelDraftOpen);
  const currentSessionId = useCurrentChatSessionStore((state) => state.currentSessionId);
  const hasSessionId = Boolean(currentSessionId);
  const shouldRenderChatPanel = !isChatPage && (hasSessionId || chatPanelDraftOpen);
  const safeChatPanelCollapsed = !shouldRenderChatPanel || chatPanelCollapsed;
  const { rootRef, chatResizeGuideRef, chatPanelWidth, chatResizing, onResizeStart } =
    useChatPanelResize(!isChatPage);

  useUpdateEffect(() => {
    if (isChatPage) return;
    if (shouldRenderChatPanel) {
      setChatPanelCollapsed(false);
      return;
    }
    setChatPanelCollapsed(true);
  }, [isChatPage, setChatPanelCollapsed, shouldRenderChatPanel]);

  useUpdateEffect(() => {
    if (!hasSessionId && !chatPanelDraftOpen) return;
    if (hasSessionId) {
      setChatPanelDraftOpen(false);
    }
  }, [chatPanelDraftOpen, hasSessionId, setChatPanelDraftOpen]);

  const handleChatExpand = () => {
    if (!shouldRenderChatPanel) return;
    setChatPanelCollapsed(false);
  };
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ ['--chat-panel-width' as string]: `${chatPanelWidth}px` }}
    >
      {chatResizing && <div ref={chatResizeGuideRef} className={styles.chatResizeGuide} />}
      <aside
        className={clsx(styles.leftSider, sidebarCollapsed && styles.leftSiderCollapsed)}
        aria-label="应用侧边栏"
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      </aside>

      <div className={styles.middleLayout}>
        {shouldRenderChatPanel && safeChatPanelCollapsed && (
          <div className={styles.chatHandleZone}>
            <button
              type="button"
              className={styles.chatExpandHandle}
              onClick={handleChatExpand}
              aria-label="展开聊天面板"
            >
              <Bot />
            </button>
          </div>
        )}
        <main className={styles.middleContent}>
          <Outlet />
        </main>
      </div>

      {!isChatPage && (
        <aside
          className={clsx(styles.rightSider, safeChatPanelCollapsed && styles.rightSiderCollapsed)}
          aria-label="聊天面板"
          aria-hidden={safeChatPanelCollapsed ? true : undefined}
        >
          {!safeChatPanelCollapsed && (
            <button
              type="button"
              className={`${styles.chatResizeHandle} ${chatResizing ? styles.chatResizeHandleActive : ''}`}
              onMouseDown={onResizeStart}
              aria-label="调整聊天面板宽度"
            />
          )}
          <div className={styles.rightSiderInner}>
            {shouldRenderChatPanel ? <ChatPanel collapsed={safeChatPanelCollapsed} /> : null}
          </div>
        </aside>
      )}
    </div>
  );
}

export default AppLayout;
