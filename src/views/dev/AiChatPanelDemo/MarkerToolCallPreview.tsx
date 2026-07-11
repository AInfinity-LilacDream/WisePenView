import { Marker, MarkerContent, MarkerIcon } from '@/components/_shadcn';
import markerStyles from '@/components/_shadcn/marker.module.less';
import ToolCallBlock from '@/components/ChatPanel/MessageList/MessageItem/ToolCallBlock';
import { Spin } from '@/components/Feedback';
import { Search, Wrench } from 'lucide-react';
import styles from './MarkerToolCallPreview.module.less';

function MarkerToolCallPreview() {
  return (
    <section className={styles.section} aria-label="Marker 与 ToolCall 样式预览">
      <h2 className={styles.title}>Marker / ToolCall 样式</h2>
      <p className={styles.desc}>
        对照 shadcn Marker 三种 variant，以及 ToolCallBlock 在 AI 消息中的呈现。
      </p>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Marker variants</h3>
        <Marker>
          <MarkerIcon>
            <Wrench />
          </MarkerIcon>
          <MarkerContent>默认 inline 标记（状态说明）</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <Search />
          </MarkerIcon>
          <MarkerContent>border 变体 — 带底部分隔线</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>separator — 居中分隔标签</MarkerContent>
        </Marker>
        <Marker variant="separator" role="status">
          <MarkerIcon>
            <Spin size="small" />
          </MarkerIcon>
          <MarkerContent className={markerStyles.shimmer}>正在加载更早消息...</MarkerContent>
        </Marker>
      </div>

      <div className={styles.group}>
        <h3 className={styles.groupTitle}>ToolCallBlock</h3>
        <ToolCallBlock content="" loading />
        <ToolCallBlock content="web_search" />
        <ToolCallBlock content={'read_file\nweb_search\ncode_interpreter'} />
      </div>
    </section>
  );
}

export default MarkerToolCallPreview;
