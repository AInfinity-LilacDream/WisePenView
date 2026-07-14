import AppModal from '@/components/Overlay/AppModal';
import { useResourceService } from '@/domains';
import type { ResourceComment } from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { useRequest } from 'ahooks';
import { ChevronLeft, X } from 'lucide-react';
import { useState, type UIEvent } from 'react';

import CommentComposer from './CommentComposer';
import CommentEntry from './CommentEntry';
import { COMMENT_PAGE_SIZE, REPLY_MODAL_THRESHOLD, REPLY_PREVIEW_SIZE } from './constants';
import styles from './style.module.less';
import { updateCommentById } from './utils';

interface ReplyThreadProps {
  rootComment: ResourceComment;
  repliesExpanded: boolean;
  refreshVersion: number;
  likedCommentIds: ReadonlySet<string>;
  currentUserId?: string;
  resourceOwnerId?: string | null;
  composerAuthor: { name: string; avatar?: string };
  onExpandedChange(expanded: boolean): void;
  onCommentsChanged(): void;
  onImagePreview(url: string): void;
  onLike(commentEntry: ResourceComment): Promise<boolean>;
  onDelete(commentEntry: ResourceComment): void;
}

export default function ReplyThread({
  rootComment,
  repliesExpanded,
  refreshVersion,
  likedCommentIds,
  currentUserId,
  resourceOwnerId,
  composerAuthor,
  onExpandedChange,
  onCommentsChanged,
  onImagePreview,
  onLike,
  onDelete,
}: ReplyThreadProps) {
  const resourceService = useResourceService();
  const [replyPage, setReplyPage] = useState(1);
  const [replyEntries, setReplyEntries] = useState<ResourceComment[]>([]);
  const [replyTarget, setReplyTarget] = useState<ResourceComment>();
  const {
    data: replyPageData,
    loading: repliesLoading,
    error: repliesError,
    run: loadReplies,
  } = useRequest(
    async (nextPage: number, append: boolean) => {
      const nextReplyPage = await resourceService.listReplies({
        rootCommentId: rootComment.commentId,
        page: nextPage,
        size: repliesExpanded ? COMMENT_PAGE_SIZE : REPLY_PREVIEW_SIZE,
      });
      setReplyEntries((currentReplies) =>
        append ? [...currentReplies, ...nextReplyPage.items] : nextReplyPage.items
      );
      setReplyPage(nextPage);
      return nextReplyPage;
    },
    {
      ready: rootComment.replyCount > 0,
      defaultParams: [1, false],
      refreshDeps: [rootComment.commentId, rootComment.replyCount, refreshVersion, repliesExpanded],
    }
  );

  if (!repliesExpanded && rootComment.replyCount === 0) return null;

  const handleReplyListScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget;
    const nearBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 80;
    if (
      repliesExpanded &&
      nearBottom &&
      !repliesLoading &&
      replyPageData &&
      replyPage < replyPageData.totalPage
    ) {
      void loadReplies(replyPage + 1, true);
    }
  };

  const usesReplyModal = rootComment.replyCount > REPLY_MODAL_THRESHOLD;
  const showsInlineToggle = rootComment.replyCount > REPLY_PREVIEW_SIZE;
  const visibleReplies =
    !repliesExpanded && usesReplyModal ? replyEntries.slice(0, REPLY_PREVIEW_SIZE) : replyEntries;

  const submitReply = async (
    targetComment: ResourceComment,
    content: string,
    imageUrls: string[]
  ) => {
    await resourceService.createReply({
      resourceId: rootComment.resourceId,
      replyTo: targetComment.commentId,
      content,
      imageUrls,
    });
    setReplyTarget(undefined);
    await loadReplies(1, false);
    onCommentsChanged();
  };

  const toggleReplyTarget = (commentEntry: ResourceComment) =>
    setReplyTarget((currentTarget) =>
      currentTarget?.commentId === commentEntry.commentId ? undefined : commentEntry
    );

  const handleReplyLike = async (commentEntry: ResourceComment) => {
    const wasLiked = likedCommentIds.has(commentEntry.commentId);
    const previousLikeCount = commentEntry.likeCount;
    const liked = await onLike(commentEntry);
    if (liked === wasLiked) return liked;
    setReplyEntries((currentReplies) =>
      updateCommentById(currentReplies, commentEntry.commentId, (currentReply) => ({
        ...currentReply,
        likeCount: Math.max(0, previousLikeCount + (liked ? 1 : -1)),
      }))
    );
    return liked;
  };

  const replyList = (
    <>
      {repliesLoading && replyEntries.length === 0 ? (
        <span className={styles.muted}>正在加载回复...</span>
      ) : null}
      {visibleReplies.map((replyEntry) => (
        <div key={replyEntry.commentId}>
          <CommentEntry
            commentEntry={replyEntry}
            currentUserId={currentUserId}
            resourceOwnerId={resourceOwnerId}
            liked={likedCommentIds.has(replyEntry.commentId)}
            replyComposerOpen={replyTarget?.commentId === replyEntry.commentId}
            onImagePreview={onImagePreview}
            onReply={toggleReplyTarget}
            onLike={handleReplyLike}
            onDelete={onDelete}
          />
          {replyTarget?.commentId === replyEntry.commentId ? (
            <div className={styles.inlineReplyComposer}>
              <CommentComposer
                author={composerAuthor}
                placeholder={`回复 ${replyEntry.author.name}`}
                onSubmit={(content, imageUrls) => submitReply(replyEntry, content, imageUrls)}
              />
            </div>
          ) : null}
        </div>
      ))}
      {repliesExpanded && repliesLoading && replyEntries.length > 0 ? (
        <p className={styles.loadingMore}>正在加载更多回复...</p>
      ) : null}
      {repliesError ? <p className={styles.errorText}>{parseErrorMessage(repliesError)}</p> : null}
    </>
  );

  const rootReplyComposer = (
    <CommentComposer
      author={composerAuthor}
      placeholder={`回复 ${rootComment.author.name}`}
      onSubmit={(content, imageUrls) => submitReply(rootComment, content, imageUrls)}
    />
  );

  if (usesReplyModal) {
    return (
      <>
        <div className={styles.replyPreview}>
          <div>{replyList}</div>
          <button
            type="button"
            className={styles.viewReplies}
            onClick={() => onExpandedChange(true)}
          >
            查看全部 {rootComment.replyCount} 条回复
          </button>
        </div>
        <AppModal
          isOpen={repliesExpanded}
          onOpenChange={onExpandedChange}
          title={
            <button
              type="button"
              className={styles.replyModalTitle}
              onClick={() => onExpandedChange(false)}
            >
              <ChevronLeft size={22} />
              <span>评论回复</span>
            </button>
          }
          size="full"
          footer={false}
          containerClassName={styles.replyModalContainer}
          dialogClassName={styles.replyModalDialog}
          headerClassName={styles.replyModalHeader}
          bodyClassName={styles.replyModalBody}
        >
          <button
            type="button"
            className={styles.replyModalClose}
            aria-label="关闭回复弹窗"
            onClick={() => onExpandedChange(false)}
          >
            <X size={30} />
          </button>
          <div className={styles.replyModal} onScroll={handleReplyListScroll}>
            <div className={styles.replyModalRoot}>
              <CommentEntry
                commentEntry={rootComment}
                currentUserId={currentUserId}
                resourceOwnerId={resourceOwnerId}
                liked={likedCommentIds.has(rootComment.commentId)}
                onImagePreview={onImagePreview}
                onLike={onLike}
                onDelete={onDelete}
              />
            </div>
            <div className={styles.replyModalCount}>{rootComment.replyCount} 条回复</div>
            <div className={styles.replyModalList}>{replyList}</div>
            <div className={styles.modalDefaultComposer}>{rootReplyComposer}</div>
          </div>
        </AppModal>
      </>
    );
  }

  return (
    <div className={repliesExpanded ? styles.repliesExpanded : styles.replyPreview}>
      {repliesExpanded ? (
        <div className={styles.repliesHeader}>
          <strong>{rootComment.replyCount} 条其他回复</strong>
          <button type="button" onClick={() => onExpandedChange(false)}>
            收起回复
          </button>
        </div>
      ) : null}
      <div>{replyList}</div>
      {!repliesExpanded && showsInlineToggle ? (
        <button type="button" className={styles.viewReplies} onClick={() => onExpandedChange(true)}>
          查看全部 {rootComment.replyCount} 条回复
        </button>
      ) : null}
    </div>
  );
}
