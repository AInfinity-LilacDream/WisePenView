import clsx from 'clsx';
import { ChevronLeft, IndentDecrease, IndentIncrease } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../_common/UserProfile';
import SidebarDrive from './_components/SidebarDrive';
import type { DriveSidebarProps } from './index.type';
import styles from './style.module.less';

function DriveSidebar({ collapsed, onToggle }: DriveSidebarProps) {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate('/app/drive');
  }, [navigate]);

  return (
    <div className={clsx(styles.sider, collapsed && styles.collapsed)}>
      <div className={styles.header}>
        <button type="button" onClick={onToggle} className={styles.iconBtn} aria-label="切换侧边栏">
          {collapsed ? (
            <IndentIncrease size={18} style={{ transform: 'rotate(180deg)' }} />
          ) : (
            <IndentDecrease size={18} style={{ transform: 'rotate(180deg)' }} />
          )}
        </button>

        {!collapsed && (
          <button type="button" onClick={handleBack} className={styles.backBtn}>
            <ChevronLeft size={18} />
            <span className={styles.backText}>返回主菜单</span>
          </button>
        )}
      </div>

      <div className={clsx(styles.body, collapsed && styles.bodyCollapsed)} aria-hidden={collapsed}>
        <SidebarDrive />
      </div>

      <UserProfile collapsed={collapsed} />
    </div>
  );
}

export default memo(DriveSidebar);
