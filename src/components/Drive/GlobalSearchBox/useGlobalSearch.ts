import { useResourceService } from '@/domains';
import type { SearchHitItem, SearchScope } from '@/domains/Resource';
import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import { useInfiniteScroll } from 'ahooks';
import type { RefObject } from 'react';

/** 单页大小：与后端 `@Max(100)` 上限一致，20 是首屏滚动加载的舒适步长 */
export const PAGE_SIZE = 20;

export interface UseGlobalSearchOptions {
  /** 已防抖关键词；空串时停止请求 */
  keyword: string;
  scope: SearchScope;
  /** 滚动容器 ref，作为 useInfiniteScroll 的监听目标 */
  target: RefObject<HTMLElement | null>;
}

export interface SearchInfiniteData {
  list: SearchHitItem[];
  total: number;
  page: number;
  totalPage: number;
  isNoMore: boolean;
}

/** ahooks useInfiniteScroll 承载分页/滚动监听/竞态拦截；keyword/scope 变化触发 reloadDeps 回 page 1 */
export function useGlobalSearch({ keyword, scope, target }: UseGlobalSearchOptions) {
  const resourceService = useResourceService();
  const trimmed = keyword.trim();

  return useInfiniteScroll<SearchInfiniteData>(
    async (current) => {
      const nextPage = current ? Math.floor(current.list.length / PAGE_SIZE) + 1 : 1;
      const res = await resourceService.globalSearch({
        keyword: trimmed,
        scope,
        page: nextPage,
        size: PAGE_SIZE,
      });
      return {
        list: res.list,
        total: res.total,
        page: res.page,
        totalPage: res.totalPage,
        isNoMore: nextPage >= res.totalPage,
      };
    },
    {
      target,
      isNoMore: (d) => !!d?.isNoMore,
      reloadDeps: [trimmed, scope],
      manual: trimmed.length === 0,
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );
}
