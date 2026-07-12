import logoImg from '@/assets/images/logo-icon.png';
import AppNavigationControls from '@/layouts/AppNavigation/AppNavigationControls';
import clsx from 'clsx';
import type { SidebarHeaderProps } from './index.type';
import styles from './style.module.less';

function SidebarHeader({
  collapsed,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onToggle,
  title = 'WisePen',
  nav,
}: SidebarHeaderProps) {
  const hasNav = Boolean(nav);
  const logoContent = (
    <>
      <div className={styles.logoIcon}>
        <img src={logoImg} alt="WisePen" />
      </div>
      <span className={styles.logoText}>{title}</span>
    </>
  );

  return (
    <div className={styles.header}>
      <div className={clsx(styles.headerTop, collapsed && styles.collapsedHeaderTop)}>
        {!collapsed ? <div className={styles.logo}>{logoContent}</div> : null}
        {onToggle && onGoBack && onGoForward ? (
          <AppNavigationControls
            sidebarCollapsed={collapsed}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={onGoBack}
            onGoForward={onGoForward}
            onToggleSidebar={onToggle}
          />
        ) : null}
      </div>

      {hasNav ? (
        <div className={clsx(styles.headerNav, collapsed && styles.headerNavCollapsed)}>{nav}</div>
      ) : null}
    </div>
  );
}

export default SidebarHeader;
