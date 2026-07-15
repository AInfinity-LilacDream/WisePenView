import { Spin } from '@/components/Feedback';
import { Toast } from '@heroui/react';
import { useMount, useUnmount } from 'ahooks';
import { Suspense, useRef } from 'react';
import { RouterProvider, type ClientOnErrorFunction } from 'react-router-dom';
import router from './router';

import { ServicesProvider } from '@/domains';
import { DEFAULT_HEROUI_THEME, ThemeApplier } from '@/theme';
import { authSessionCoordinator } from '@/utils/auth/authSessionCoordinator';
import { reportError } from '@/utils/error';
import styles from './App.module.less';

const handleRouterError: ClientOnErrorFunction = (error, { errorInfo, location }) => {
  reportError(error, {
    origin: 'route',
    pathname: location.pathname,
    componentStack: errorInfo?.componentStack ?? undefined,
  });
};

function PageLoadingFallback() {
  return (
    <div className={styles.pageLoadingFallback}>
      <Spin size="large" />
    </div>
  );
}

function App() {
  const unsubscribeAuthSessionRef = useRef<(() => void) | null>(null);

  useMount(() => {
    unsubscribeAuthSessionRef.current = authSessionCoordinator.subscribe();
  });

  useUnmount(() => {
    unsubscribeAuthSessionRef.current?.();
    unsubscribeAuthSessionRef.current = null;
  });

  return (
    <ThemeApplier defaultTheme={DEFAULT_HEROUI_THEME}>
      <ServicesProvider>
        <Toast.Provider maxVisibleToasts={3} placement="top" />
        <Suspense fallback={<PageLoadingFallback />}>
          <RouterProvider router={router} onError={handleRouterError} />
        </Suspense>
      </ServicesProvider>
    </ThemeApplier>
  );
}

export default App;
