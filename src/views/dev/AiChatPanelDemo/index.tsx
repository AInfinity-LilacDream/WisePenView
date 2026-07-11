import type { Message } from '@/components/ChatPanel/index.type';
import MessageList from '@/components/ChatPanel/MessageList';
import panelStyles from '@/components/ChatPanel/style.module.less';
import { Button } from '@heroui/react';
import { useInterval, useUnmount } from 'ahooks';
import { useCallback, useRef, useState } from 'react';
import MarkerToolCallPreview from './MarkerToolCallPreview';
import styles from './style.module.less';

let demoMessageSeq = 0;

function nextDemoId(prefix: string): string {
  demoMessageSeq += 1;
  return `demo-${prefix}-${demoMessageSeq}`;
}

const LONG_MARKDOWN_APPEND = `

## 布局抖动测试

| 列 A | 列 B |
| --- | --- |
| 异步表格 | 高度变化 |

\`\`\`typescript
function anchorMe() {
  return 'Markdown / 代码块加载后视线应保持稳定';
}
\`\`\`
`;

const STREAM_CHARS = [
  '根据你的问题，',
  '我先梳理上下文，',
  '再给出分步说明。',
  '\n\n1. 贴底时才自动跟随滚动',
  '\n2. 上滑阅读时内容在视口外继续增长',
  '\n3. 点击「向下」按钮可恢复跟随',
];

const SEED_MESSAGES: Message[] = [
  {
    id: nextDemoId('user'),
    role: 'user',
    content: '帮我解释一下 MessageScroller 的 scrollAnchor 有什么用？',
    createAt: Date.now() - 120_000,
  },
  {
    id: nextDemoId('ai'),
    role: 'ai',
    content:
      'scrollAnchor 用于在新回合开始时，把某条消息锚定在视口靠上的位置，给后续流式回答留出向下生长的空间，同时保留上一轮的一小段上下文。',
    createAt: Date.now() - 90_000,
    meta: { provider: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o' },
  },
];

function createPrependBatch(): Message[] {
  return [
    {
      id: nextDemoId('user'),
      role: 'user',
      content: '更早的一条用户消息（prepend 测试）',
      createAt: Date.now() - 600_000,
    },
    {
      id: nextDemoId('ai'),
      role: 'ai',
      content: '更早的 AI 回复。加载后当前阅读位置不应跳动。',
      createAt: Date.now() - 540_000,
      meta: { provider: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o' },
    },
  ];
}

function AiChatPanelDemo() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [canLoadMoreHistory, setCanLoadMoreHistory] = useState(true);
  const [scrollAnchorRole, setScrollAnchorRole] = useState<'user' | 'ai'>('user');
  const [fullWidth, setFullWidth] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamIndexRef = useRef(0);
  const streamMessageIdRef = useRef<string | null>(null);

  const stopStreaming = useCallback(() => {
    streamIndexRef.current = 0;
    streamMessageIdRef.current = null;
    setStreaming(false);
  }, []);

  useUnmount(stopStreaming);

  useInterval(
    () => {
      const messageId = streamMessageIdRef.current;
      if (!messageId) return;

      const chunk = STREAM_CHARS[streamIndexRef.current];
      if (chunk === undefined) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, loading: false } : message
          )
        );
        stopStreaming();
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, content: `${message.content ?? ''}${chunk}`, loading: true }
            : message
        )
      );
      streamIndexRef.current += 1;
    },
    streaming ? 120 : undefined
  );

  const addUserTurn = useCallback(
    (text: string) => {
      stopStreaming();
      const userMessage: Message = {
        id: nextDemoId('user'),
        role: 'user',
        content: text,
        createAt: Date.now(),
      };
      const aiMessage: Message = {
        id: nextDemoId('ai'),
        role: 'ai',
        content: '',
        loading: true,
        createAt: Date.now(),
        meta: { provider: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o' },
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      streamMessageIdRef.current = aiMessage.id;
      streamIndexRef.current = 0;
      setStreaming(true);
    },
    [stopStreaming]
  );

  const handleLoadMoreHistory = useCallback(async () => {
    if (loadingMoreHistory) return;
    setLoadingMoreHistory(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setMessages((prev) => [...createPrependBatch(), ...prev]);
    setLoadingMoreHistory(false);
    setCanLoadMoreHistory(false);
  }, [loadingMoreHistory]);

  const appendLayoutShift = useCallback(() => {
    setMessages((prev) => {
      const lastAiIndex = [...prev].reverse().findIndex((message) => message.role === 'ai');
      if (lastAiIndex < 0) return prev;
      const index = prev.length - 1 - lastAiIndex;
      return prev.map((message, messageIndex) =>
        messageIndex === index
          ? { ...message, content: `${message.content}${LONG_MARKDOWN_APPEND}` }
          : message
      );
    });
  }, []);

  const addToolCallTurn = useCallback(() => {
    stopStreaming();
    const userMessage: Message = {
      id: nextDemoId('user'),
      role: 'user',
      content: '帮我查一下最近文档里关于 scroll anchor 的说明',
      createAt: Date.now(),
    };
    const aiMessage: Message = {
      id: nextDemoId('ai'),
      role: 'ai',
      content:
        '我调用了文档检索和网页搜索，整理如下：\n\n1. 新回合应锚定在 user 消息\n2. 流式时仅在贴底跟随\n3. prepend 历史不应跳动阅读位置',
      toolContent: 'read_file\nweb_search',
      createAt: Date.now(),
      meta: { provider: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o' },
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
  }, [stopStreaming]);

  const addToolCallLoadingTurn = useCallback(() => {
    stopStreaming();
    const userMessage: Message = {
      id: nextDemoId('user'),
      role: 'user',
      content: '正在调用工具时 Marker 长什么样？',
      createAt: Date.now(),
    };
    const aiMessage: Message = {
      id: nextDemoId('ai'),
      role: 'ai',
      content: '',
      loading: true,
      createAt: Date.now(),
      meta: { provider: 'openai', modelId: 'gpt-4o', modelName: 'GPT-4o' },
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    streamMessageIdRef.current = aiMessage.id;
    streamIndexRef.current = 0;
    setStreaming(true);
  }, [stopStreaming]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>AiChatPanel 效果演示</h1>
        <p className={styles.subtitle}>
          用于 MessageList / 滚动工程学验收。访问路径：
          <code className={styles.path}>/app/dev/ai-chat-panel-demo</code>
        </p>
        <ul className={styles.checklist}>
          <li>贴底时流式跟随；上滑 / 滚轮后定格，点「向下」恢复</li>
          <li>新回合 scrollAnchor（可切换 user / ai）</li>
          <li>滚到顶自动加载更早消息（prepend 不跳）</li>
          <li>「追加 Markdown」测试布局抖动时的锚定</li>
        </ul>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.toolbar} aria-label="演示控制">
          <Button size="sm" variant="primary" onPress={() => addUserTurn('这是一条新的用户问题')}>
            新回合 + 流式 AI
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => addUserTurn('请用三点总结 scroll engineering 原则')}
          >
            再发一问
          </Button>
          <Button size="sm" variant="secondary" onPress={addToolCallTurn}>
            ToolCall 完成态
          </Button>
          <Button size="sm" variant="secondary" onPress={addToolCallLoadingTurn}>
            ToolCall 流式中
          </Button>
          <Button size="sm" variant="secondary" onPress={appendLayoutShift}>
            追加 Markdown（抖动）
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={streaming}
            onPress={() => {
              stopStreaming();
              setMessages([]);
            }}
          >
            清空 → Welcome
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => setScrollAnchorRole((role) => (role === 'user' ? 'ai' : 'user'))}
          >
            scrollAnchor: {scrollAnchorRole}
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setFullWidth((value) => !value)}>
            布局: {fullWidth ? 'fullWidth' : 'embedded'}
          </Button>
          <p className={styles.toolbarHint}>
            {streaming ? '流式输出中…（可先上滑测试是否定格）' : '就绪'}
          </p>
        </aside>

        <MarkerToolCallPreview />

        <div
          className={`${styles.panelShell} ${fullWidth ? styles.panelShellFull : styles.panelShellEmbedded}`}
        >
          <div
            className={`${panelStyles.panel} ${fullWidth ? panelStyles.fullWidth : ''} ${styles.panelFill}`}
          >
            <div className={panelStyles.content}>
              <div className={styles.demoTopBar}>演示面板（无真实 ChatInput）</div>
              <div className={panelStyles.messageViewport}>
                <MessageList
                  messages={messages}
                  canLoadMoreHistory={canLoadMoreHistory}
                  loadingMoreHistory={loadingMoreHistory}
                  onLoadMoreHistory={handleLoadMoreHistory}
                  scrollAnchorRole={scrollAnchorRole}
                  onPromptClick={(text) => addUserTurn(text)}
                />
              </div>
            </div>
            <div className={`${panelStyles.footer} ${styles.footerMock}`}>
              <div className={styles.footerMockInner}>
                ChatInput 区域示意 — 发送态 / 停止生成在完整 AiChatPanel 中验收
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiChatPanelDemo;
