import type { AdminPageKey } from './pages';
import { ADMIN_PAGE_CONFIGS } from './pages';
import styles from './style.module.less';

interface AdminPageProps {
  pageKey: AdminPageKey;
}

function AdminPage({ pageKey }: AdminPageProps) {
  const page = ADMIN_PAGE_CONFIGS[pageKey];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{page.title}</h1>
        <span className={styles.pageSubtitle}>{page.subtitle}</span>
      </div>
    </div>
  );
}

export default AdminPage;
