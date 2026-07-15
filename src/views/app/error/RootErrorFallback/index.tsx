import type { FallbackProps } from 'react-error-boundary';

import { getErrorReportId } from '@/utils/error';
import styles from './style.module.less';

function RootErrorFallback({ error }: FallbackProps) {
  const errorId = getErrorReportId(error);

  return (
    <main className={styles.root}>
      <div className={styles.content}>
        <div className={styles.brand}>WisePen</div>
        <h1 className={styles.title}>应用暂时无法继续运行</h1>
        <p className={styles.description}>请重新加载页面。若问题持续，请将错误编号提供给开发者。</p>
        <p className={styles.errorId}>错误编号：{errorId}</p>
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => window.location.assign('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    </main>
  );
}

export default RootErrorFallback;
