import { Spin } from '@/components/Feedback';
import { Toast } from '@heroui/react';
import { useMount, useUnmount } from 'ahooks';
import { Suspense, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';

import { ServicesProvider } from '@/domains';
import { DEFAULT_HEROUI_THEME, ThemeApplier } from '@/theme';
import { authSessionCoordinator } from '@/utils/auth/authSessionCoordinator';
import styles from './App.module.less';

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
          <RouterProvider router={router} />
        </Suspense>
      </ServicesProvider>
    </ThemeApplier>
  );
}

export default App;
