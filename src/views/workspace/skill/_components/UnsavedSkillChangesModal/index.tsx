import AppAlertDialog from '@/components/AppAlertDialog';

type UnsavedSkillChangesMode = 'publish' | 'leave';

interface UnsavedSkillChangesModalProps {
  isOpen: boolean;
  mode: UnsavedSkillChangesMode;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const modalCopy: Record<
  UnsavedSkillChangesMode,
  {
    title: string;
    description: string;
    confirmText: string;
  }
> = {
  publish: {
    title: '发布前保存修改',
    description: '当前 Skill 有未保存修改。发布前需要先保存，否则本次修改不会进入发布版本。',
    confirmText: '保存并发布',
  },
  leave: {
    title: '保存后离开页面？',
    description: '当前 Skill 有未保存修改。保存后再离开可避免丢失本次编辑。',
    confirmText: '保存并退出',
  },
};

function UnsavedSkillChangesModal({
  isOpen,
  mode,
  isLoading = false,
  onCancel,
  onConfirm,
}: UnsavedSkillChangesModalProps) {
  const copy = modalCopy[mode];

  return (
    <AppAlertDialog
      type="confirm"
      isOpen={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open && !isLoading) onCancel();
      }}
      title={copy.title}
      description={copy.description}
      confirmText={copy.confirmText}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isConfirmLoading={isLoading}
      isDismissable={!isLoading}
    />
  );
}

export default UnsavedSkillChangesModal;
