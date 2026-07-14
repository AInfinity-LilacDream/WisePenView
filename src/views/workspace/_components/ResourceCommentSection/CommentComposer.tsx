import { useImageService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { Avatar, Button } from '@heroui/react';
import { useRequest, useUnmount } from 'ahooks';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState, type ClipboardEvent } from 'react';

import { IMAGE_ONLY_CONTENT } from './constants';
import styles from './style.module.less';
import { getAuthorInitial, resizeCommentTextarea } from './utils';

export interface CommentComposerProps {
  author: {
    name: string;
    avatar?: string;
  };
  placeholder: string;
  onSubmit(content: string, imageUrls: string[]): Promise<void>;
}

interface PendingImageProps {
  file: File;
  onRemove(): void;
}

function PendingImage({ file, onRemove }: PendingImageProps) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  useUnmount(() => URL.revokeObjectURL(previewUrl));

  return (
    <span className={styles.pendingImage}>
      <img src={previewUrl} alt={file.name} />
      <span>{file.name}</span>
      <button type="button" aria-label={`移除图片 ${file.name}`} onClick={onRemove}>
        <X size={14} />
      </button>
    </span>
  );
}

export default function CommentComposer({ author, placeholder, onSubmit }: CommentComposerProps) {
  const imageService = useImageService();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string>();
  const [focused, setFocused] = useState(false);
  const expanded =
    focused || Boolean(content.trim()) || pendingImages.length > 0 || Boolean(submitError);
  const canSubmit = Boolean(content.trim()) || pendingImages.length > 0;

  const appendImages = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setPendingImages((currentImages) => [...currentImages, ...imageFiles]);
    setFocused(true);
    setSubmitError(undefined);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter(
        (clipboardItem) => clipboardItem.kind === 'file' && clipboardItem.type.startsWith('image/')
      )
      .map((clipboardItem, index) => {
        const file = clipboardItem.getAsFile();
        if (!file) return null;
        const extension = file.type.split('/')[1] || 'png';
        return new File([file], `pasted-image-${Date.now()}-${index}.${extension}`, {
          type: file.type,
        });
      })
      .filter((file): file is File => Boolean(file));
    appendImages(pastedImages);
  };

  const { loading: submitting, runAsync: submitComment } = useRequest(
    async () => {
      const normalizedContent = content.trim();
      if (!normalizedContent && pendingImages.length === 0) {
        throw new Error('请输入评论内容或添加图片');
      }
      const imageUrls = await Promise.all(
        pendingImages.map(async (file) => {
          const uploadResult = await imageService.uploadImage({
            file,
            scene: 'PUBLIC_IMAGE_FOR_USER',
            bizTag: 'resource-comment',
          });
          return uploadResult.publicUrl;
        })
      );
      await onSubmit(normalizedContent || IMAGE_ONLY_CONTENT, imageUrls);
      setContent('');
      resizeCommentTextarea(textareaRef.current);
      setPendingImages([]);
      setSubmitError(undefined);
    },
    {
      manual: true,
      onError: (error) => setSubmitError(parseErrorMessage(error)),
    }
  );

  return (
    <div
      className={styles.composerRow}
      data-expanded={expanded}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Avatar aria-label={author.name} className={styles.composerAvatar}>
        {author.avatar ? <Avatar.Image src={author.avatar} alt={author.name} /> : null}
        <Avatar.Fallback>{getAuthorInitial(author.name)}</Avatar.Fallback>
      </Avatar>
      <div className={styles.composer}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={content}
          placeholder={placeholder}
          rows={1}
          disabled={submitting}
          onFocus={() => setFocused(true)}
          onPaste={handlePaste}
          onChange={(event) => {
            setContent(event.target.value);
            resizeCommentTextarea(event.currentTarget);
          }}
        />
        {pendingImages.length > 0 ? (
          <div className={styles.pendingImages}>
            {pendingImages.map((file, index) => (
              <PendingImage
                key={`${file.name}-${file.lastModified}-${index}`}
                file={file}
                onRemove={() =>
                  setPendingImages((currentImages) =>
                    currentImages.filter((_, imageIndex) => imageIndex !== index)
                  )
                }
              />
            ))}
          </div>
        ) : null}
        <div className={styles.composerActions}>
          <button
            type="button"
            className={styles.imagePicker}
            disabled={submitting}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImagePlus size={18} />
            <span>添加图片</span>
          </button>
          <input
            ref={imageInputRef}
            className={styles.imageInput}
            type="file"
            accept="image/*"
            multiple
            disabled={submitting}
            onChange={(event) => {
              appendImages(Array.from(event.target.files ?? []));
              event.currentTarget.value = '';
            }}
          />
          <Button
            variant="primary"
            size="sm"
            isDisabled={!canSubmit || submitting}
            aria-busy={submitting || undefined}
            onPress={() => void submitComment()}
          >
            {submitting ? '发布中...' : '发布'}
          </Button>
        </div>
        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}
      </div>
    </div>
  );
}
