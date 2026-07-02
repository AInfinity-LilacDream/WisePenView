/** 资源互动区：大圆形点赞按钮 + 星级评分 */
import LikeButton from '@/components/LikeButton';
import Rating from '@/components/Rating';
import { useResourceService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useDebounceFn, useRequest } from 'ahooks';
import { useMemo, useState } from 'react';
import type { ResourceActionFooterProps } from './index.type';
import styles from './style.module.less';

const TOGGLE_LIKE_DEBOUNCE_MS = 2000;
const RATE_DEBOUNCE_MS = 2000;

const RATE_HINT: Record<number, string> = {
  1: '失望',
  2: '一般',
  3: '还行',
  4: '不错',
  5: '很棒',
};

function ResourceActionFooter({ resourceId, onRateSuccess }: ResourceActionFooterProps) {
  const resourceService = useResourceService();
  const [displayLiked, setDisplayLiked] = useState<boolean | undefined>(undefined);
  const [displayUserScore, setDisplayUserScore] = useState<number | null | undefined>(undefined);

  const { data: likeStatusData } = useRequest(() => resourceService.getLikeStatus(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
    onSuccess: () => setDisplayLiked(undefined),
  });
  const resolvedLiked = displayLiked ?? likeStatusData?.liked ?? false;

  const { run: runToggleLike } = useRequest(
    () => resourceService.interactToggleLike({ resourceId }),
    {
      manual: true,
      onError: (err) => {
        setDisplayLiked(undefined);
        toast.danger(parseErrorMessage(err));
      },
    }
  );
  const { run: debouncedToggleLike } = useDebounceFn(runToggleLike, {
    wait: TOGGLE_LIKE_DEBOUNCE_MS,
  });

  const { data: rateData } = useRequest(() => resourceService.getRate(resourceId), {
    ready: Boolean(resourceId),
    refreshDeps: [resourceId],
    onSuccess: () => setDisplayUserScore(undefined),
  });
  const resolvedScore = displayUserScore ?? rateData?.score ?? 0;
  const rateHintText = useMemo(() => {
    if (displayUserScore != null) return RATE_HINT[displayUserScore] ?? `${displayUserScore} 分`;
    return resolvedScore ? `已评 ${resolvedScore} 分` : '评个分吧';
  }, [displayUserScore, resolvedScore]);

  const { run: runRate } = useRequest(
    (score: number) => resourceService.interactRate({ resourceId, score }),
    {
      manual: true,
      onSuccess: () => onRateSuccess?.(),
      onError: (err) => {
        setDisplayUserScore(undefined);
        toast.danger(parseErrorMessage(err));
      },
    }
  );
  const { run: debouncedRate } = useDebounceFn(runRate, { wait: RATE_DEBOUNCE_MS });

  const handleLikeClick = () => {
    setDisplayLiked(!resolvedLiked);
    debouncedToggleLike();
  };

  const handleRateChange = (nextScore: number) => {
    setDisplayUserScore(nextScore);
    debouncedRate(nextScore);
  };

  return (
    <div className={styles.footer}>
      <LikeButton liked={resolvedLiked} onClick={handleLikeClick} />
      <div className={styles.rateSection}>
        <div className={styles.rateWrap}>
          <Rating value={resolvedScore} onValueChange={handleRateChange} />
          <span className={styles.interactLabel}>{rateHintText}</span>
        </div>
      </div>
    </div>
  );
}

export default ResourceActionFooter;
