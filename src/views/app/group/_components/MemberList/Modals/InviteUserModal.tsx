import AppModal from '@/components/AppModal';
import { Button, toast } from '@heroui/react';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import type { InviteUserModalProps } from './index.type';
import styles from './style.module.less';

function InviteUserModal({ isOpen, onOpenChange, inviteCode }: InviteUserModalProps) {
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setCopied(false);
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode ?? '');
      setCopied(true);
      toast.success('邀请码已复制到剪贴板');
    } catch {
      toast.danger('复制失败，请手动复制');
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="邀请用户"
      actions={
        <>
          <Button variant="secondary" onPress={handleClose}>
            关闭
          </Button>
          <Button variant="primary" onPress={handleCopy} isDisabled={!inviteCode}>
            <Copy size={16} aria-hidden="true" />
            {copied ? '已复制' : '复制'}
          </Button>
        </>
      }
    >
      <div className={styles.inviteContainer}>
        <div className={styles.inviteCodeWrap}>
          <div className={styles.inviteCode}>{inviteCode ?? '暂无邀请码'}</div>
        </div>
        <div className={styles.inviteHint}>分享此邀请码给其他用户，他们可以使用此码加入小组</div>
      </div>
    </AppModal>
  );
}

export default InviteUserModal;
