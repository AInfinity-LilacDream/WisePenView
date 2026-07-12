import type { ReactNode } from 'react';

export interface AppIconButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
}
