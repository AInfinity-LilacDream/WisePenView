import { Button } from '@heroui/react';
import { useLocation, useNavigate, useRouteError } from 'react-router-dom';

import { ResultState } from '@/components/Feedback';
import { getErrorReportId } from '@/utils/error';
import { buildAppErrorInfo } from '../errorInfo';
import styles from './style.module.less';

function RouteError() {
  const navigate = useNavigate();
  const location = useLocation();
  const error = useRouteError();
  const errorInfo = buildAppErrorInfo(error);
  const errorId = getErrorReportId(error);

  return (
    <main className={styles.root}>
      <ResultState
        className={styles.result}
        status={errorInfo.status}
        title={errorInfo.title}
        subTitle={errorInfo.subTitle}
        extra={
          <div className={styles.actions}>
            <Button variant="primary" onPress={() => window.location.reload()}>
              重新加载
            </Button>
            <Button onPress={() => navigate(-1)}>返回上一页</Button>
          </div>
        }
      >
        <p className={styles.errorId}>
          错误编号：{errorId} · 页面：{location.pathname}
        </p>
      </ResultState>
    </main>
  );
}

export default RouteError;
