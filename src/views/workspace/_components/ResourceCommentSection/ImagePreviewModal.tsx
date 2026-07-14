import AppModal from '@/components/Overlay/AppModal';
import { X } from 'lucide-react';

import styles from './style.module.less';

export interface ImagePreviewModalProps {
  imageUrl?: string;
  onOpenChange(open: boolean): void;
}

export default function ImagePreviewModal({ imageUrl, onOpenChange }: ImagePreviewModalProps) {
  return (
    <AppModal
      isOpen={Boolean(imageUrl)}
      onOpenChange={onOpenChange}
      size="full"
      footer={false}
      contentMode="dialog"
      containerClassName={styles.imagePreviewContainer}
      dialogClassName={styles.imagePreviewDialog}
    >
      <button
        type="button"
        className={styles.imagePreviewClose}
        aria-label="关闭图片预览"
        onClick={() => onOpenChange(false)}
      >
        <X size={30} />
      </button>
      <div className={styles.imagePreviewBody}>
        {imageUrl ? <img src={imageUrl} alt="评论图片详情" /> : null}
      </div>
    </AppModal>
  );
}
