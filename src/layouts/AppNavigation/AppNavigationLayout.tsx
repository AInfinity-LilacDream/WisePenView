import { useUpdateEffect } from 'ahooks';
import { useState } from 'react';
import { NavigationType, Outlet, useNavigate, useNavigationType } from 'react-router-dom';
import { AppNavigationContext, type AppNavigationContextValue } from './AppNavigationContext';

const readHistoryIndex = (): number | null => {
  const index = window.history.state?.idx;
  return typeof index === 'number' ? index : null;
};

function AppNavigationLayout() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const currentIndex = readHistoryIndex();
  const [firstIndex] = useState(currentIndex);
  const [furthestIndex, setFurthestIndex] = useState(currentIndex);

  // 新跳转会截断浏览器的前进分支；POP 则保留已到达过的最远位置。
  useUpdateEffect(() => {
    if (currentIndex == null) return;
    if (navigationType === NavigationType.Push) {
      setFurthestIndex(currentIndex);
      return;
    }
    setFurthestIndex((index) => (index == null || currentIndex > index ? currentIndex : index));
  }, [currentIndex, navigationType]);

  const effectiveFurthestIndex =
    navigationType === NavigationType.Push ? currentIndex : furthestIndex;
  const value: AppNavigationContextValue = {
    canGoBack: currentIndex != null && firstIndex != null && currentIndex > firstIndex,
    canGoForward:
      currentIndex != null &&
      effectiveFurthestIndex != null &&
      currentIndex < effectiveFurthestIndex,
    goBack: () => navigate(-1),
    goForward: () => navigate(1),
  };

  return (
    <AppNavigationContext.Provider value={value}>
      <Outlet />
    </AppNavigationContext.Provider>
  );
}

export default AppNavigationLayout;
