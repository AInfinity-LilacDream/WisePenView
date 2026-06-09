import { useKeyPress } from 'ahooks';
import { Button, Tooltip } from 'antd';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useState } from 'react';
import SearchModal from './SearchModal';
import type { GlobalSearchBoxProps } from './index.type';
import styles from './style.module.less';

const IS_MAC = navigator.platform.toLowerCase().includes('mac');
const SHORTCUT_LABEL = IS_MAC ? '⌘ K' : 'Ctrl K';

/** 放大镜触发器 + 受控 Modal；监听 ctrl/⌘+K 打开 */
function GlobalSearchBox({ className }: GlobalSearchBoxProps) {
  const [open, setOpen] = useState(false);

  useKeyPress(
    ['ctrl.k', 'meta.k'],
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    { exactMatch: true }
  );

  return (
    <>
      <Tooltip
        title={
          <span>
            打开全局搜索 <kbd className={styles.tooltipKbd}>{SHORTCUT_LABEL}</kbd>
          </span>
        }
      >
        <Button
          className={clsx(styles.trigger, className)}
          icon={<Search size={16} />}
          onClick={() => setOpen(true)}
          aria-label="打开全局搜索"
        >
          <span className={styles.triggerLabel}>搜索</span>
          <kbd className={styles.triggerKbd}>{SHORTCUT_LABEL}</kbd>
        </Button>
      </Tooltip>
      <SearchModal open={open} onCancel={() => setOpen(false)} />
    </>
  );
}

export default GlobalSearchBox;
