import AppAlertDialog from '@/components/Overlay/AppAlertDialog';

interface PresetRestoreConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function PresetRestoreConfirmDialog({
  isOpen,
  title,
  description,
  onOpenChange,
  onConfirm,
}: PresetRestoreConfirmDialogProps) {
  return (
    <AppAlertDialog
      type="warning"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelText="取消"
      confirmText="恢复预设"
      onConfirm={onConfirm}
      isDismissable
    />
  );
}
