import type { ResourceComment } from '@/domains/Resource';
import { Avatar } from '@heroui/react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import styles from './style.module.less';
import {
  formatCommentTime,
  getAuthorInitial,
  getCommentDateTime,
  hasVisibleCommentContent,
  normalizeCommentImageUrl,
} from './utils';

export interface CommentEntryProps {
  commentEntry: ResourceComment;
  currentUserId?: string;
  resourceOwnerId?: string | null;
  liked: boolean;
  replyComposerOpen?: boolean;
  onImagePreview(url: string): void;
  onReply?(commentEntry: ResourceComment): void;
  onLike(commentEntry: ResourceComment): Promise<boolean>;
  onDelete(commentEntry: ResourceComment): void;
}

interface CommentImageProps {
  url: string;
  onPreview(url: string): void;
}

function CommentImage({ url, onPreview }: CommentImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const normalizedUrl = normalizeCommentImageUrl(url);
  if (!normalizedUrl) return null;
  if (loadFailed) return <span className={styles.imageFallback}>图片加载失败</span>;
  return (
    <button
      type="button"
      className={styles.imageButton}
      aria-label="查看评论图片详情"
      onClick={() => onPreview(normalizedUrl)}
    >
      <img src={normalizedUrl} alt="评论图片" loading="lazy" onError={() => setLoadFailed(true)} />
    </button>
  );
}

function CommentImages({
  imageUrls,
  onPreview,
}: {
  imageUrls: string[];
  onPreview(url: string): void;
}) {
  if (imageUrls.length === 0) return null;
  return (
    <div className={styles.imageGrid}>
      {imageUrls.map((url, index) => (
        <CommentImage url={url} key={`${url}-${index}`} onPreview={onPreview} />
      ))}
    </div>
  );
}

export default function CommentEntry({
  commentEntry,
  currentUserId,
  resourceOwnerId,
  liked,
  replyComposerOpen = false,
  onImagePreview,
  onReply,
  onLike,
  onDelete,
}: CommentEntryProps) {
  const canDelete = currentUserId === commentEntry.authorId || currentUserId === resourceOwnerId;
  return (
    <article className={styles.commentItem}>
      <Avatar aria-label={commentEntry.author.name} className={styles.avatar}>
        {commentEntry.author.avatar ? (
          <Avatar.Image src={commentEntry.author.avatar} alt={commentEntry.author.name} />
        ) : null}
        <Avatar.Fallback>{getAuthorInitial(commentEntry.author.name)}</Avatar.Fallback>
      </Avatar>
      <div className={styles.commentBody}>
        <div className={styles.authorLine}>
          <strong>{commentEntry.author.name}</strong>
          {commentEntry.replyToUser ? <span>回复 {commentEntry.replyToUser.name}</span> : null}
        </div>
        {commentEntry.deleted ? (
          <p className={styles.deletedText}>该评论已删除</p>
        ) : (
          <>
            {hasVisibleCommentContent(commentEntry.content) ? (
              <p className={styles.contentText}>{commentEntry.content}</p>
            ) : null}
            <CommentImages imageUrls={commentEntry.imageUrls} onPreview={onImagePreview} />
          </>
        )}
        <div className={styles.metaLine}>
          <time dateTime={getCommentDateTime(commentEntry.createTime)}>
            {formatCommentTime(commentEntry.createTime)}
          </time>
          {!commentEntry.deleted ? (
            <div className={styles.itemActions}>
              {onReply ? (
                <button
                  type="button"
                  className={replyComposerOpen ? styles.activeReply : undefined}
                  onClick={() => onReply(commentEntry)}
                >
                  <MessageCircle size={16} />
                  {replyComposerOpen ? '取消回复' : '回复'}
                </button>
              ) : null}
              <button
                type="button"
                className={liked ? styles.liked : undefined}
                aria-label={
                  liked
                    ? `取消点赞，当前 ${commentEntry.likeCount} 个赞`
                    : `点赞，当前 ${commentEntry.likeCount} 个赞`
                }
                onClick={() => void onLike(commentEntry)}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                {commentEntry.likeCount}
              </button>
              {canDelete ? (
                <button type="button" onClick={() => onDelete(commentEntry)}>
                  <Trash2 size={16} />
                  删除
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
