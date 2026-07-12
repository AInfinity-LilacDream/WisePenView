import { createContext, useContext } from 'react';

export interface AppNavigationContextValue {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

export const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export const useAppNavigation = (): AppNavigationContextValue => {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation 必须在 AppNavigationLayout 内使用');
  }
  return context;
};
