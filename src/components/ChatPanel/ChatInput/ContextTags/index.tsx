import { useChatPageStore } from '@/store';
import { LoaderCircle, TriangleAlert, X } from 'lucide-react';
import styles from './style.module.less';

function ContextTags() {
  const activeDocRefs = useChatPageStore((state) => state.activeDocRefs);
  const activeAttachments = useChatPageStore((state) => state.activeAttachments);
  const pendingImageMetas = useChatPageStore((state) => state.pendingImageMetas);
  const pendingAttachmentUploads = useChatPageStore((state) => state.pendingAttachmentUploads);
  const removeDocRef = useChatPageStore((state) => state.removeDocRef);
  const removeAttachment = useChatPageStore((state) => state.removeAttachment);
  const removePendingImage = useChatPageStore((state) => state.removePendingImage);
  const removePendingAttachmentUpload = useChatPageStore(
    (state) => state.removePendingAttachmentUpload
  );

  const hasAny =
    activeDocRefs.length > 0 ||
    activeAttachments.length > 0 ||
    pendingImageMetas.length > 0 ||
    pendingAttachmentUploads.length > 0;
  if (!hasAny) return null;

  return (
    <div className={styles.tags}>
      {activeDocRefs.map((ref) => (
        <span key={ref.resourceId} className={`${styles.tag} ${styles.docTag}`}>
          引用 {ref.resourceName}
          <span className={styles.tagRemove} onClick={() => removeDocRef(ref.resourceId)}>
            <X size={11} />
          </span>
        </span>
      ))}
      {activeAttachments.map((att) => (
        <span key={att.attachmentId} className={`${styles.tag} ${styles.attachmentTag}`}>
          附件 {att.filename}
          <span className={styles.tagRemove} onClick={() => removeAttachment(att.attachmentId)}>
            <X size={11} />
          </span>
        </span>
      ))}
      {pendingImageMetas.map((img) => (
        <span key={img.id} className={`${styles.tag} ${styles.imageTag}`}>
          {img.thumbnailUrl ? (
            <img src={img.thumbnailUrl} alt="" className={styles.imageThumb} />
          ) : null}
          {img.filename}
          <span className={styles.tagRemove} onClick={() => removePendingImage(img.id)}>
            <X size={11} />
          </span>
        </span>
      ))}
      {pendingAttachmentUploads.map((upload) => (
        <span
          key={upload.id}
          className={`${styles.tag} ${upload.status === 'uploading' ? styles.uploadingTag : styles.failedTag}`}
        >
          {upload.status === 'uploading' ? (
            <LoaderCircle size={13} className={styles.spinIcon} />
          ) : (
            <TriangleAlert size={13} />
          )}{' '}
          {upload.filename}
          <span
            className={styles.tagRemove}
            onClick={() => removePendingAttachmentUpload(upload.id)}
          >
            <X size={11} />
          </span>
        </span>
      ))}
    </div>
  );
}

export default ContextTags;
