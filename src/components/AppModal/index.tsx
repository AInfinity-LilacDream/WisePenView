import { Modal } from '@/components/Overlay';
import { Button } from '@heroui/react';
import clsx from 'clsx';
import { CircleAlert, CircleCheck, Info, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

import type {
  AppModalBodyProps,
  AppModalFooterProps,
  AppModalProps,
  AppModalType,
} from './index.type';
import styles from './style.module.less';

const DEFAULT_TYPE: AppModalType = 'info';

const BANNER_ICON_MAP = {
  info: Info,
  confirm: CircleCheck,
  warning: TriangleAlert,
  danger: ShieldAlert,
} satisfies Record<AppModalType, ElementType>;

const DEFAULT_BANNER_TITLE: Record<AppModalType, ReactNode> = {
  info: '提示',
  confirm: '请确认',
  warning: '请注意',
  danger: '危险操作',
};

function AppModalBody({ className, ...props }: AppModalBodyProps) {
  return <Modal.Body className={clsx(styles.body, className)} {...props} />;
}

function AppModalFooter({ className, ...props }: AppModalFooterProps) {
  return <Modal.Footer className={clsx(styles.footer, className)} {...props} />;
}

function AppModalRoot({
  type = DEFAULT_TYPE,
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  alert,
  bannerTitle,
  bannerDescription,
  confirmText,
  cancelText = '取消',
  closeText,
  onConfirm,
  onCancel,
  isConfirmLoading = false,
  isConfirmDisabled = false,
  size = 'sm',
  placement = 'center',
  isDismissable = true,
  actions,
  footer,
  contentMode = 'body',
  contentDelay,
  deferContent,
  className,
  containerClassName,
  dialogClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  classNames,
}: AppModalProps) {
  const isDanger = type === 'danger';
  const isWarningLike = type === 'warning' || type === 'danger';
  const headerDescription = isWarningLike ? undefined : description;
  const resolvedBannerDescription =
    bannerDescription ?? alert ?? (isWarningLike ? description : null);
  const shouldShowBanner =
    isWarningLike || alert != null || bannerTitle != null || bannerDescription != null;
  const shouldUseConfirmFooter =
    type === 'confirm' || isWarningLike || onConfirm != null || confirmText != null;
  const Icon = shouldShowBanner ? (BANNER_ICON_MAP[type] ?? CircleAlert) : null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onOpenChange(false);
  };

  const renderFooterContent = (): ReactNode => {
    if (footer === false || footer === null) return null;
    if (footer !== undefined) return footer;
    if (actions !== undefined) return actions;

    if (shouldUseConfirmFooter) {
      return (
        <>
          <Button variant="secondary" isDisabled={isConfirmLoading} onPress={handleCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            isDisabled={isConfirmDisabled || isConfirmLoading}
            aria-busy={isConfirmLoading || undefined}
            onPress={onConfirm}
          >
            {confirmText ?? '确定'}
          </Button>
        </>
      );
    }

    if (closeText) {
      return (
        <Button variant="primary" onPress={handleCancel}>
          {closeText}
        </Button>
      );
    }

    return null;
  };

  const footerContent = renderFooterContent();
  const shouldRenderFooter = footerContent != null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      contentDelay={contentDelay}
      deferContent={deferContent}
    >
      <Modal.Backdrop isDismissable={isDismissable}>
        <Modal.Container
          size={size}
          placement={placement}
          className={clsx(styles.container, containerClassName, classNames?.container)}
        >
          <Modal.Dialog
            className={clsx(styles.dialog, className, dialogClassName, classNames?.dialog)}
          >
            {title || headerDescription ? (
              <Modal.Header className={clsx(styles.header, headerClassName, classNames?.header)}>
                {title ? (
                  <Modal.Heading className={clsx(styles.heading, classNames?.heading)}>
                    {title}
                  </Modal.Heading>
                ) : null}
                {headerDescription ? (
                  <div className={clsx(styles.description, classNames?.description)}>
                    {headerDescription}
                  </div>
                ) : null}
              </Modal.Header>
            ) : null}

            {contentMode === 'dialog' ? (
              children
            ) : (
              <AppModalBody className={clsx(bodyClassName, classNames?.body)}>
                {shouldShowBanner && Icon ? (
                  <div className={clsx(styles.banner, styles[`banner${type}`], classNames?.banner)}>
                    <Icon className={styles.bannerIcon} size={18} aria-hidden />
                    <div className={styles.bannerContent}>
                      <div className={styles.bannerTitle}>
                        {bannerTitle ?? DEFAULT_BANNER_TITLE[type]}
                      </div>
                      {resolvedBannerDescription ? (
                        <div className={styles.bannerDescription}>{resolvedBannerDescription}</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {children}
              </AppModalBody>
            )}

            {shouldRenderFooter ? (
              <AppModalFooter className={clsx(footerClassName, classNames?.footer)}>
                {footerContent}
              </AppModalFooter>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export const AppModal = Object.assign(AppModalRoot, {
  Body: AppModalBody,
  DeferredContent: Modal.DeferredContent,
  Footer: AppModalFooter,
});

export default AppModal;
