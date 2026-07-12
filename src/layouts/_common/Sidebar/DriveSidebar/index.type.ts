export interface DriveSidebarProps {
  collapsed: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggle: () => void;
}
