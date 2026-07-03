import { Chip } from '@heroui/react';
import clsx from 'clsx';
import { Image, LoaderCircle, Paperclip, TriangleAlert, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  useChatInputStore,
  useChatInputStoreApi,
} from '../ChatInputStore';
import type { AttachmentStripProps } from './index.type';
import styles from '../style.module.less';

function AttachmentStrip({
  selectedContextText,
  selectedPreview,
  hasSelectedContext,
  onClearSelectedContext,
}: AttachmentStripProps) {
  const store = useChatInputStoreApi();
  const { resources, attachments, images, uploads } = useChatInputStore(
    useShallow((state) => ({
      resources: state.activeDocRefs,
      attachments: state.activeAttachments,
      images: state.pendingImageMetas,
      uploads: state.pendingAttachmentUploads,
    }))
  );
  const {
    removeActiveAttachment,
    removeDocRef,
    removePendingAttachmentUpload,
    removePendingImageMeta,
  } = store.getState();

  const hasAny =
    hasSelectedContext ||
    resources.length > 0 ||
    attachments.length > 0 ||
    images.length > 0 ||
    uploads.length > 0;

  if (!hasAny) return null;

  return (
    <div className={styles.attachmentArea} aria-label="输入上下文">
      {hasSelectedContext ? (
        <Chip size="sm" variant="soft" className={styles.contextChip}>
          <Chip.Label title={selectedContextText}>选中内容：{selectedPreview}</Chip.Label>
          <button
            type="button"
            className={styles.chipRemoveButton}
            onClick={onClearSelectedContext}
            aria-label="清除已选内容"
          >
            <X size={12} />
          </button>
        </Chip>
      ) : null}

      {resources.map((resource) => (
        <Chip key={resource.resourceId} size="sm" variant="soft" className={styles.fileChip}>
          <Paperclip size={13} />
          <Chip.Label>{resource.resourceName}</Chip.Label>
          <button
            type="button"
            className={styles.chipRemoveButton}
            onClick={() => removeDocRef(resource.resourceId)}
            aria-label={`移除文档 ${resource.resourceName}`}
          >
            <X size={12} />
          </button>
        </Chip>
      ))}

      {attachments.map((attachment) => (
        <Chip
          key={attachment.attachmentId}
          size="sm"
          variant="soft"
          className={styles.fileChip}
        >
          <Paperclip size={13} />
          <Chip.Label>{attachment.filename}</Chip.Label>
          <button
            type="button"
            className={styles.chipRemoveButton}
            onClick={() => removeActiveAttachment(attachment.attachmentId)}
            aria-label={`移除附件 ${attachment.filename}`}
          >
            <X size={12} />
          </button>
        </Chip>
      ))}

      {images.map((imageMeta) => (
        <Chip key={imageMeta.id} size="sm" variant="soft" className={styles.imageChip}>
          {imageMeta.thumbnailUrl ? (
            <img src={imageMeta.thumbnailUrl} alt="" className={styles.imageThumb} />
          ) : (
            <Image size={13} />
          )}
          <Chip.Label>{imageMeta.filename}</Chip.Label>
          <button
            type="button"
            className={styles.chipRemoveButton}
            onClick={() => removePendingImageMeta(imageMeta.id)}
            aria-label={`移除图片 ${imageMeta.filename}`}
          >
            <X size={12} />
          </button>
        </Chip>
      ))}

      {uploads.map((upload) => (
        <Chip
          key={upload.id}
          size="sm"
          variant="soft"
          className={clsx(styles.uploadChip, upload.status === 'failed' && styles.failedUploadChip)}
        >
          {upload.status === 'uploading' ? (
            <LoaderCircle size={13} className={styles.spinIcon} />
          ) : (
            <TriangleAlert size={13} />
          )}
          <Chip.Label>{upload.filename}</Chip.Label>
          <button
            type="button"
            className={styles.chipRemoveButton}
            onClick={() => removePendingAttachmentUpload(upload.id)}
            aria-label={`移除上传项 ${upload.filename}`}
          >
            <X size={12} />
          </button>
        </Chip>
      ))}
    </div>
  );
}

export default AttachmentStrip;
