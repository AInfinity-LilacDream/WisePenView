export interface AppSidebarProps {
  collapsed: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggle: () => void;
}
