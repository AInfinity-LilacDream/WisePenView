import AppAlertDialog from '@/components/Overlay/AppAlertDialog';
import AppModal from '@/components/Overlay/AppModal';
import { useResourceService, useUserService } from '@/domains';
import type { CommentSortBy, ResourceComment } from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useInViewport, useMount, useRequest, useUnmount } from 'ahooks';
import { useRef, useState, type CSSProperties, type UIEvent } from 'react';

import CommentComposer from './CommentComposer';
import CommentEntry from './CommentEntry';
import { COMMENT_MODAL_THRESHOLD, COMMENT_PAGE_SIZE } from './constants';
import ImagePreviewModal from './ImagePreviewModal';
import type { ResourceCommentSectionProps } from './index.type';
import ReplyThread from './ReplyThread';
import styles from './style.module.less';
import { updateCommentById } from './utils';

export default function ResourceCommentSection({
  resourceId,
  resourceOwnerId,
  totalCommentCount,
  onCommentsChanged,
}: ResourceCommentSectionProps) {
  const resourceService = useResourceService();
  const userService = useUserService();
  const [sortBy, setSortBy] = useState<CommentSortBy>('CREATE_TIME');
  const [topLevelPage, setTopLevelPage] = useState(1);
  const [topLevelComments, setTopLevelComments] = useState<ResourceComment[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<ReadonlySet<string>>(new Set());
  const [replyComposerRootId, setReplyComposerRootId] = useState<string>();
  const [expandedReplyRootId, setExpandedReplyRootId] = useState<string>();
  const [allCommentsModalOpen, setAllCommentsModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>();
  const [commentPendingDeletion, setCommentPendingDeletion] = useState<ResourceComment>();
  const [deleteError, setDeleteError] = useState<string>();
  const [replyRefreshVersion, setReplyRefreshVersion] = useState(0);
  const [sectionRect, setSectionRect] = useState<{ left: number; width: number }>();
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLElement>(null);
  const cleanupSectionObserversRef = useRef<(() => void) | undefined>(undefined);
  const [loadMoreSentinelVisible] = useInViewport(loadMoreSentinelRef);
  const [commentSectionVisible] = useInViewport(commentSectionRef);

  useMount(() => {
    const commentSection = commentSectionRef.current;
    if (!commentSection) return;

    const updateSectionRect = () => {
      const rect = commentSection.getBoundingClientRect();
      setSectionRect({ left: rect.left, width: rect.width });
    };

    updateSectionRect();
    window.addEventListener('resize', updateSectionRect);
    window.addEventListener('scroll', updateSectionRect, true);

    const resizeObserver = new ResizeObserver(updateSectionRect);
    resizeObserver.observe(commentSection);
    cleanupSectionObserversRef.current = () => {
      window.removeEventListener('resize', updateSectionRect);
      window.removeEventListener('scroll', updateSectionRect, true);
      resizeObserver.disconnect();
    };
  });

  useUnmount(() => cleanupSectionObserversRef.current?.());

  const { data: currentUser } = useRequest(() => userService.getUserInfo());
  const {
    loading: topLevelCommentsLoading,
    error: topLevelCommentsError,
    data: topLevelCommentPage,
    run: loadTopLevelComments,
  } = useRequest(
    async (nextPage: number, append: boolean, nextSortBy: CommentSortBy) => {
      const nextCommentPage = await resourceService.listComments({
        resourceId,
        sortBy: nextSortBy,
        page: nextPage,
        size: COMMENT_PAGE_SIZE,
      });
      setTopLevelComments((currentComments) =>
        append ? [...currentComments, ...nextCommentPage.items] : nextCommentPage.items
      );
      setTopLevelPage(nextPage);
      return nextCommentPage;
    },
    { defaultParams: [1, false, sortBy], refreshDeps: [resourceId] }
  );

  useRequest(() => resourceService.getCommentLikeIds(resourceId), {
    refreshDeps: [resourceId],
    onSuccess: setLikedCommentIds,
  });

  useRequest(
    async () => {
      if (!topLevelCommentPage) return;
      const shouldUseModal =
        (totalCommentCount ?? topLevelCommentPage.total) > COMMENT_MODAL_THRESHOLD;
      if (
        topLevelCommentsLoading ||
        topLevelPage >= topLevelCommentPage.totalPage ||
        shouldUseModal
      ) {
        return;
      }
      await loadTopLevelComments(topLevelPage + 1, true, sortBy);
    },
    {
      ready: Boolean(loadMoreSentinelVisible) && topLevelComments.length > 0,
      refreshDeps: [
        loadMoreSentinelVisible,
        topLevelPage,
        topLevelCommentPage?.totalPage,
        sortBy,
        totalCommentCount,
      ],
    }
  );

  const refreshCommentSection = async () => {
    await loadTopLevelComments(1, false, sortBy);
    setReplyRefreshVersion((version) => version + 1);
    await onCommentsChanged?.();
  };

  const handleCommentLike = async (commentEntry: ResourceComment) => {
    const wasLiked = likedCommentIds.has(commentEntry.commentId);
    const previousLikeCount = commentEntry.likeCount;
    try {
      const liked = await resourceService.toggleCommentLike({
        resourceId,
        commentId: commentEntry.commentId,
      });
      setLikedCommentIds((currentLikedIds) => {
        const nextLikedIds = new Set(currentLikedIds);
        if (liked) nextLikedIds.add(commentEntry.commentId);
        else nextLikedIds.delete(commentEntry.commentId);
        return nextLikedIds;
      });
      if (liked !== wasLiked) {
        setTopLevelComments((currentComments) =>
          updateCommentById(currentComments, commentEntry.commentId, (topLevelComment) => ({
            ...topLevelComment,
            likeCount: Math.max(0, previousLikeCount + (liked ? 1 : -1)),
          }))
        );
      }
      return liked;
    } catch (error) {
      toast.danger(parseErrorMessage(error));
      return wasLiked;
    }
  };

  const { loading: deletingComment, run: confirmCommentDeletion } = useRequest(
    async (commentEntry: ResourceComment) => {
      await resourceService.deleteComment({ resourceId, commentId: commentEntry.commentId });
      setCommentPendingDeletion(undefined);
      setDeleteError(undefined);
      setReplyComposerRootId(undefined);
      setExpandedReplyRootId(undefined);
      await refreshCommentSection();
    },
    {
      manual: true,
      onError: (error) => setDeleteError(parseErrorMessage(error)),
    }
  );

  const handleSortChange = (nextSortBy: CommentSortBy) => {
    setSortBy(nextSortBy);
    void loadTopLevelComments(1, false, nextSortBy);
  };

  const composerAuthor = {
    name:
      currentUser?.realName?.trim() ||
      currentUser?.nickname?.trim() ||
      currentUser?.username ||
      '当前用户',
    avatar: currentUser?.avatar,
  };
  const displayedCommentCount = totalCommentCount ?? topLevelCommentPage?.total ?? 0;
  const shouldUseAllCommentsModal = displayedCommentCount > COMMENT_MODAL_THRESHOLD;
  const visibleTopLevelComments = shouldUseAllCommentsModal
    ? topLevelComments.slice(0, COMMENT_PAGE_SIZE)
    : topLevelComments;
  const composerDockStyle: CSSProperties | undefined =
    commentSectionVisible && sectionRect
      ? {
          left: sectionRect.left + sectionRect.width / 2,
          width: Math.min(760, sectionRect.width),
        }
      : undefined;

  const handleAllCommentsScroll = (event: UIEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget;
    const nearBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 80;
    if (
      nearBottom &&
      !topLevelCommentsLoading &&
      topLevelCommentPage &&
      topLevelPage < topLevelCommentPage.totalPage
    ) {
      void loadTopLevelComments(topLevelPage + 1, true, sortBy);
    }
  };

  const toggleTopLevelReplyComposer = (topLevelComment: ResourceComment) =>
    setReplyComposerRootId((currentRootId) =>
      currentRootId === topLevelComment.commentId ? undefined : topLevelComment.commentId
    );

  const renderTopLevelComment = (topLevelComment: ResourceComment) => (
    <div key={topLevelComment.commentId}>
      <CommentEntry
        commentEntry={topLevelComment}
        currentUserId={currentUser?.id}
        resourceOwnerId={resourceOwnerId}
        liked={likedCommentIds.has(topLevelComment.commentId)}
        replyComposerOpen={replyComposerRootId === topLevelComment.commentId}
        onImagePreview={setPreviewImageUrl}
        onReply={toggleTopLevelReplyComposer}
        onLike={handleCommentLike}
        onDelete={setCommentPendingDeletion}
      />
      {replyComposerRootId === topLevelComment.commentId ? (
        <div className={styles.inlineReplyComposer}>
          <CommentComposer
            author={composerAuthor}
            placeholder={`回复 ${topLevelComment.author.name}`}
            onSubmit={async (content, imageUrls) => {
              await resourceService.createReply({
                resourceId,
                replyTo: topLevelComment.commentId,
                content,
                imageUrls,
              });
              setReplyComposerRootId(undefined);
              await refreshCommentSection();
            }}
          />
        </div>
      ) : null}
      <ReplyThread
        rootComment={topLevelComment}
        repliesExpanded={expandedReplyRootId === topLevelComment.commentId}
        refreshVersion={replyRefreshVersion}
        likedCommentIds={likedCommentIds}
        currentUserId={currentUser?.id}
        resourceOwnerId={resourceOwnerId}
        composerAuthor={composerAuthor}
        onExpandedChange={(expanded) =>
          setExpandedReplyRootId(expanded ? topLevelComment.commentId : undefined)
        }
        onCommentsChanged={() => void refreshCommentSection()}
        onImagePreview={setPreviewImageUrl}
        onLike={handleCommentLike}
        onDelete={setCommentPendingDeletion}
      />
    </div>
  );

  return (
    <section ref={commentSectionRef} className={styles.section} aria-label="资源评论区">
      <div
        className={commentSectionVisible ? styles.composerDockFixed : styles.composerDock}
        style={composerDockStyle}
      >
        <CommentComposer
          author={composerAuthor}
          placeholder="理性发言，友善互动"
          onSubmit={async (content, imageUrls) => {
            await resourceService.createComment({ resourceId, content, imageUrls });
            await refreshCommentSection();
          }}
        />
      </div>
      <div className={styles.listHeader}>
        <strong>{displayedCommentCount} 条评论</strong>
        <div className={styles.sortButtons}>
          <button
            type="button"
            className={sortBy === 'CREATE_TIME' ? styles.activeSort : undefined}
            onClick={() => handleSortChange('CREATE_TIME')}
          >
            最新
          </button>
          <button
            type="button"
            className={sortBy === 'LIKE_COUNT' ? styles.activeSort : undefined}
            onClick={() => handleSortChange('LIKE_COUNT')}
          >
            最热
          </button>
        </div>
      </div>
      {topLevelCommentsError ? (
        <p className={styles.errorText}>{parseErrorMessage(topLevelCommentsError)}</p>
      ) : null}
      {topLevelCommentsLoading && topLevelComments.length === 0 ? (
        <p className={styles.muted}>正在加载评论...</p>
      ) : null}
      {!topLevelCommentsLoading && topLevelComments.length === 0 ? (
        <p className={styles.emptyText}>还没有评论，来发表第一条吧。</p>
      ) : null}
      <div className={styles.commentList}>
        {visibleTopLevelComments.map(renderTopLevelComment)}
        {topLevelCommentsLoading && topLevelComments.length > 0 ? (
          <p className={styles.loadingMore}>正在加载更多评论...</p>
        ) : null}
        {shouldUseAllCommentsModal ? (
          <button
            type="button"
            className={styles.viewAllComments}
            onClick={() => setAllCommentsModalOpen(true)}
          >
            查看全部 {displayedCommentCount} 条评论
          </button>
        ) : null}
        {!shouldUseAllCommentsModal ? (
          <div ref={loadMoreSentinelRef} className={styles.loadMoreSentinel} aria-hidden="true" />
        ) : null}
      </div>
      <AppModal
        isOpen={allCommentsModalOpen}
        onOpenChange={setAllCommentsModalOpen}
        title={`${displayedCommentCount} 条评论`}
        footer={false}
        containerClassName={styles.commentModalContainer}
        bodyClassName={styles.replyModalBody}
      >
        <div className={styles.commentModal} onScroll={handleAllCommentsScroll}>
          {topLevelComments.map(renderTopLevelComment)}
          {topLevelCommentsLoading && topLevelComments.length > 0 ? (
            <p className={styles.loadingMore}>正在加载更多评论...</p>
          ) : null}
        </div>
      </AppModal>
      <AppAlertDialog
        type="danger"
        isOpen={Boolean(commentPendingDeletion)}
        onOpenChange={(open) => {
          if (!open && !deletingComment) {
            setCommentPendingDeletion(undefined);
            setDeleteError(undefined);
          }
        }}
        title="删除评论"
        description="删除后无法恢复，确定继续吗？"
        confirmText="删除"
        isConfirmLoading={deletingComment}
        isConfirmDisabled={!commentPendingDeletion}
        onConfirm={() => {
          if (commentPendingDeletion) confirmCommentDeletion(commentPendingDeletion);
        }}
      >
        {deleteError ? <p className={styles.errorText}>{deleteError}</p> : null}
      </AppAlertDialog>
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewImageUrl(undefined);
        }}
      />
    </section>
  );
}
