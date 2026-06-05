import type { ResourceItem } from '@/domains/Resource';

/** 后端 ResourceItemResponse 中的嵌套互动统计结构 */
interface RawInteractionInfo {
  readCount?: number | string | null;
  likeCount?: number | string | null;
  scoreCount?: number | string | null;
  scoreTotal?: number | string | null;
}

/**
 * 将后端 ResourceItemResponse 原始数据归一化为前端 ResourceItem：
 * - 从嵌套的 resourceInteractionInfo 中提取 readCount、likeCount
 * - 前端自行计算 scoreAvg = scoreTotal / scoreCount（scoreCount=0 时为 null）
 */
export function normalizeResourceItem<T extends Partial<ResourceItem> | null | undefined>(
  raw: T
): T {
  if (raw == null) return raw;
  const next: Partial<ResourceItem> = { ...raw };

  const interactionInfo = (raw as unknown as { resourceInteractionInfo?: RawInteractionInfo })
    .resourceInteractionInfo;

  if (interactionInfo) {
    next.readCount =
      interactionInfo.readCount != null ? Number(interactionInfo.readCount) : undefined;
    next.likeCount =
      interactionInfo.likeCount != null ? Number(interactionInfo.likeCount) : undefined;
    const scoreCount = interactionInfo.scoreCount != null ? Number(interactionInfo.scoreCount) : 0;
    const scoreTotal = interactionInfo.scoreTotal != null ? Number(interactionInfo.scoreTotal) : 0;
    next.scoreAvg = scoreCount > 0 ? scoreTotal / scoreCount : null;
  }

  return next as T;
}
