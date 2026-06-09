import EntryIcon from '@/components/Common/EntryIcon';
import type { SearchHitItem } from '@/domains/Resource';
import { useNavigateResource } from '@/hooks/useNavigateResource';
import { useKeyPress, useUpdateEffect } from 'ahooks';
import { Empty, Spin } from 'antd';
import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { groupHits } from '../groupHits';
import { useGlobalSearch } from '../useGlobalSearch';
import type { SearchResultListProps } from './index.type';
import styles from './style.module.less';

interface SearchHitRowProps {
  item: SearchHitItem;
  active: boolean;
  flatIndex: number;
  onActivate: (flatIndex: number) => void;
  onOpen: (item: SearchHitItem) => void;
}

function SearchHitRow({ item, active, flatIndex, onActivate, onOpen }: SearchHitRowProps) {
  return (
    <li
      data-flat-index={flatIndex}
      className={clsx(styles.row, active && styles.rowActive)}
      onMouseEnter={() => onActivate(flatIndex)}
      onClick={() => onOpen(item)}
    >
      <div className={styles.rowIcon}>
        <EntryIcon entryType="resource" resourceType={item.resourceType} size={18} />
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowTitle} dangerouslySetInnerHTML={{ __html: item.resourceName }} />
        {item.highlightContent && (
          <div
            className={styles.rowSnippet}
            dangerouslySetInnerHTML={{ __html: item.highlightContent }}
          />
        )}
      </div>
    </li>
  );
}

/** 分组渲染 + 无限滚动 + 键盘导航；activeIndex 渲染期 clamp 规避 effect 内 setState */
function SearchResultList({ keyword, scope, onClose }: SearchResultListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const navigateResource = useNavigateResource();
  const { data, loadingMore, noMore } = useGlobalSearch({
    keyword,
    scope,
    target: listRef,
  });

  const groups = useMemo(() => groupHits(data?.list ?? []), [data?.list]);
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  // 每组在扁平列表里的起始下标，键盘导航用；规避 indexOf 的 O(N²)
  const groupStarts = useMemo(() => {
    const starts: number[] = [];
    let cursor = 0;
    for (const group of groups) {
      starts.push(cursor);
      cursor += group.items.length;
    }
    return starts;
  }, [groups]);

  const [activeIndex, setActiveIndex] = useState(0);
  const clampedActive = flatItems.length === 0 ? 0 : Math.min(activeIndex, flatItems.length - 1);

  // 高亮项滚入视口；block:nearest 避免列表反复跳到顶/底
  useUpdateEffect(() => {
    if (flatItems.length === 0) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-flat-index="${clampedActive}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [clampedActive, flatItems.length]);

  const handleOpenHit = (item: SearchHitItem) => {
    onClose();
    navigateResource(item.resourceId, item.resourceType);
  };

  useKeyPress(
    'uparrow',
    (e) => {
      if (flatItems.length === 0) return;
      e.preventDefault();
      setActiveIndex(Math.max(0, clampedActive - 1));
    },
    { exactMatch: true }
  );
  useKeyPress(
    'downarrow',
    (e) => {
      if (flatItems.length === 0) return;
      e.preventDefault();
      setActiveIndex(Math.min(flatItems.length - 1, clampedActive + 1));
    },
    { exactMatch: true }
  );
  useKeyPress(
    'enter',
    () => {
      const item = flatItems[clampedActive];
      if (item) handleOpenHit(item);
    },
    { exactMatch: true }
  );

  const hasHits = flatItems.length > 0;

  return (
    <div ref={listRef} className={styles.list}>
      {hasHits ? (
        <>
          {groups.map((group, groupIdx) => {
            const startIndex = groupStarts[groupIdx];
            return (
              <section key={group.key} className={styles.group}>
                <header className={styles.groupHeader}>{group.label}</header>
                <ul className={styles.groupItems}>
                  {group.items.map((item, indexInGroup) => {
                    const flatIndex = startIndex + indexInGroup;
                    return (
                      <SearchHitRow
                        key={item.resourceId}
                        item={item}
                        active={flatIndex === clampedActive}
                        flatIndex={flatIndex}
                        onActivate={setActiveIndex}
                        onOpen={handleOpenHit}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {loadingMore && (
            <div className={styles.loadingMore}>
              <Spin size="small" />
            </div>
          )}
          {!loadingMore && noMore && <div className={styles.footerHint}>已展示全部结果</div>}
        </>
      ) : (
        <div className={styles.emptyWrapper}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="搜索文档、笔记和标签" />
        </div>
      )}
    </div>
  );
}

export default SearchResultList;
