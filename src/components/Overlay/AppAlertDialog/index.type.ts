import type { ComponentProps, ReactNode } from 'react';

import type { AlertDialog } from '@heroui/react';

export type AppAlertDialogType = 'confirm' | 'warning' | 'danger';

export type AppAlertDialogSize = ComponentProps<typeof AlertDialog.Container>['size'];

export type AppAlertDialogPlacement = ComponentProps<typeof AlertDialog.Container>['placement'];

export type AppAlertDialogStatus = ComponentProps<typeof AlertDialog.Icon>['status'];

export interface AppAlertDialogClassNames {
  backdrop?: string;
  container?: string;
  dialog?: string;
  icon?: string;
  header?: string;
  heading?: string;
  description?: string;
  body?: string;
  footer?: string;
}

export interface AppAlertDialogProps {
  type?: AppAlertDialogType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirmLoading?: boolean;
  isConfirmDisabled?: boolean;
  isDismissable?: boolean;
  size?: AppAlertDialogSize;
  placement?: AppAlertDialogPlacement;
  icon?: ReactNode | false;
  actions?: ReactNode;
  footer?: ReactNode | false | null;
  className?: string;
  backdropClassName?: string;
  containerClassName?: string;
  dialogClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  classNames?: AppAlertDialogClassNames;
}

export type AppAlertDialogBodyProps = ComponentProps<typeof AlertDialog.Body>;

export type AppAlertDialogFooterProps = ComponentProps<typeof AlertDialog.Footer>;
