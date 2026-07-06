import type { ResourceItem, ResourceTagBind } from '@/domains/Resource';
import { normalizeUserDisplayBaseFromApi } from '@/domains/User/mapper/userEnum.mapper';
import type { GetUserInteractionRecordApiResponse } from '../apis/InteractApi.type';
import type {
  ChangeResourceActionPermissionApiRequest,
  GlobalSearchApiResponse,
  ListResourceItemsApiRequest,
  ResourceInteractionInfoApiResponse,
  ResourceItemApiResponse,
  ResourceListPageApiResponse,
} from '../apis/ResourceApi.type';
import {
  normalizeSearchResourceType,
  resourceActionsToApiKeys,
  TAG_QUERY_LOGIC_MODE,
  type ResourceActionKey,
} from '../enum';
import type {
  GetUserResourcesRequest,
  ResourceListPage,
  SearchHitItem,
  SearchResultPage,
  UpdateResourceActionPermissionRequest,
} from '../service/index.type';
import { resolveResourceIconType } from '../utils/resolveResourceIconType';

const PERSONAL_GROUP_PREFIX = 'p_';

type ResourceItemNumericField = 'size' | 'readCount' | 'likeCount' | 'scoreAvg';
type ResourceItemApiOwnerInfo = ResourceItemApiResponse['ownerInfo'];
type ResourceItemRawOwnerInfo = ResourceItem['ownerInfo'] | ResourceItemApiOwnerInfo;
type ResourceItemRawTagBinds = ResourceItem['tagBinds'] | ResourceItemApiResponse['tagBinds'];

type NormalizableResourceItem = Omit<
  Partial<ResourceItem>,
  ResourceItemNumericField | 'ownerInfo' | 'tagBinds'
> &
  Omit<Partial<ResourceItemApiResponse>, ResourceItemNumericField | 'ownerInfo' | 'tagBinds'> & {
    size?: number;
    readCount?: number | null;
    likeCount?: number | null;
    scoreAvg?: number | null;
    ownerInfo?: ResourceItemRawOwnerInfo;
    tagBinds?: ResourceItemRawTagBinds;
    resourceInteractionInfo?: ResourceInteractionInfoApiResponse;
  };

type NormalizedResourceItem<T extends NormalizableResourceItem> = Omit<
  T,
  ResourceItemNumericField
> &
  Partial<Pick<ResourceItem, ResourceItemNumericField>>;

interface MapResourceItemContext {
  groupId?: string;
}

/**
 * 将后端 ResourceItemResponse 原始数据归一化为前端 ResourceItem
 */
export function normalizeResourceItem<T extends null | undefined>(raw: T): T;
export function normalizeResourceItem<T extends NormalizableResourceItem>(
  raw: T
): NormalizedResourceItem<T>;
export function normalizeResourceItem(
  raw: NormalizableResourceItem | null | undefined
): NormalizedResourceItem<NormalizableResourceItem> | null | undefined {
  if (raw == null) return raw;
  const next: NormalizedResourceItem<NormalizableResourceItem> = {
    ...raw,
    size: raw.size,
    readCount: raw.readCount,
    likeCount: raw.likeCount,
    scoreAvg: raw.scoreAvg,
  };

  const interactionInfo = raw.resourceInteractionInfo;

  if (interactionInfo) {
    next.readCount = interactionInfo.readCount;
    next.likeCount = interactionInfo.likeCount;
    const scoreCount = interactionInfo.scoreCount ?? 0;
    const scoreTotal = interactionInfo.scoreTotal ?? 0;
    next.scoreAvg = scoreCount > 0 ? scoreTotal / scoreCount : null;
  }

  return next;
}

/** Service 入参 → GET /resource/item/listResources query */
const mapListResourceItemsRequest = (
  params: GetUserResourcesRequest,
  overrides: Partial<ListResourceItemsApiRequest> = {}
): ListResourceItemsApiRequest => {
  const resourceType = params.resourceType;
  const tagIds = params.tagIds;
  const hasResourceType = resourceType != null && resourceType !== '';
  const hasTagIds = tagIds != null && tagIds.length > 0;

  return {
    page: params.page,
    size: params.size,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    // 未传时显式使用 OpenAPI 默认 OR。
    tagQueryLogicMode: params.tagQueryLogicMode ?? TAG_QUERY_LOGIC_MODE.OR,
    // 不传 resourceType：空串会被后端当作有效筛选值
    ...(hasResourceType ? { resourceType } : {}),
    // 不传 tagIds：空数组仍会触发按标签过滤
    ...(hasTagIds ? { tagIds } : {}),
    // 小组列表等场景由 Service 注入 groupId 等覆盖项
    ...overrides,
  };
};

const resolveTagName = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'tagName' in value) {
    const tagName = (value as { tagName?: unknown }).tagName;
    if (typeof tagName === 'string') return tagName;
  }
  return '';
};

const resolveCurrentTagBind = (
  item: ResourceItem,
  context: MapResourceItemContext
): ResourceTagBind | undefined => {
  const binds = item.tagBinds ?? [];
  if (binds.length === 0) return undefined;
  if (context.groupId) {
    return binds.find((bind) => bind.groupId === context.groupId) ?? binds[0];
  }
  return binds.find((bind) => bind.groupId?.startsWith(PERSONAL_GROUP_PREFIX)) ?? binds[0];
};

const mapTagsToCurrentTags = (
  tags: ResourceTagBind['tags']
): Record<string, string> | undefined => {
  if (!tags || typeof tags !== 'object') return undefined;
  return Object.fromEntries(
    Object.entries(tags).map(([tagId, tagInfo]) => [tagId, resolveTagName(tagInfo)])
  );
};

const isResourceItemApiOwnerInfo = (
  ownerInfo: ResourceItemRawOwnerInfo
): ownerInfo is ResourceItemApiOwnerInfo => typeof ownerInfo.identityType !== 'number';

const normalizeOwnerInfo = (
  ownerInfo: ResourceItemRawOwnerInfo | undefined
): ResourceItem['ownerInfo'] | undefined => {
  if (ownerInfo == null) return undefined;
  if (isResourceItemApiOwnerInfo(ownerInfo)) {
    return normalizeUserDisplayBaseFromApi(ownerInfo);
  }
  return ownerInfo;
};

/** 单条资源：Java Long 字符串、标签派生字段 */
const mapResourceItemFromApi = (
  raw: NormalizableResourceItem,
  context: MapResourceItemContext = {}
): ResourceItem => {
  const item = normalizeResourceItem(raw) as ResourceItem;
  const currentTagBind = resolveCurrentTagBind(item, context);
  const currentTags = mapTagsToCurrentTags(currentTagBind?.tags);
  const tagIds = Object.keys(currentTags ?? {});
  const mainTagId = currentTagBind?.primaryTagId ?? tagIds[0];
  const ownerInfo = normalizeOwnerInfo(item.ownerInfo) ?? item.ownerInfo;

  return {
    ...item,
    ownerInfo,
    currentTags,
    resourceIconType: resolveResourceIconType({
      resourceType: item.resourceType,
      resourceName: item.resourceName,
    }),
    mainTagId,
    linkTagIds: mainTagId ? tagIds.filter((tagId) => tagId !== mainTagId) : tagIds.slice(1),
  };
};

/** 分页列表 API 响应 → Service 领域分页 */
const mapResourceListPageFromApi = (
  data: ResourceListPageApiResponse,
  context: MapResourceItemContext = {}
): ResourceListPage => {
  const list = data.list.map((item) => mapResourceItemFromApi(item, context));

  return {
    list,
    total: data.total,
    page: data.page,
    size: data.size,
    totalPage: data.totalPage,
  };
};

/** userId → ResourceAction[] 转为 API 请求的 userId → 枚举 key[]；null/undefined 原样透传 */
const mapSpecifiedUsersGrantedActionsToApi = (
  value: UpdateResourceActionPermissionRequest['specifiedUsersGrantedActions']
): ChangeResourceActionPermissionApiRequest['specifiedUsersGrantedActions'] => {
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return undefined;
  }

  const byUserId: Record<string, ResourceActionKey[]> = {};
  for (const userId in value) {
    byUserId[userId] = resourceActionsToApiKeys(value[userId]) ?? [];
  }
  return byUserId;
};

const mapChangeResourceActionPermissionRequest = (
  params: UpdateResourceActionPermissionRequest
): ChangeResourceActionPermissionApiRequest => {
  return {
    resourceId: params.resourceId,
    overrideGrantedActions: resourceActionsToApiKeys(params.overrideGrantedActions),
    specifiedUsersGrantedActions: mapSpecifiedUsersGrantedActionsToApi(
      params.specifiedUsersGrantedActions
    ),
  };
};

/** 互动记录 API 响应 → 点赞状态；null（未操作）归一化为 false */
const mapLikeStatusFromApi = (
  res: GetUserInteractionRecordApiResponse | null | undefined
): { liked: boolean } => ({
  liked: res?.liked ?? false,
});

/** 互动记录 API 响应 → 评分；null（未评分）归一化为 0 */
const mapRateFromApi = (
  res: GetUserInteractionRecordApiResponse | null | undefined
): { score: number } => ({
  score: res?.score ?? 0,
});

/** 资源互动聚合统计（供互动统计组件展示） */
export interface ResourceInteractStats {
  readCount?: number | null;
  likeCount?: number | null;
  /** mapper 内已完成格式化：有评分则 "X.X 分"，无则 "暂无评分" */
  scoreAvgText: string;
}

/** ResourceItem → 聚合互动统计，供互动统计组件展示 */
const mapInteractStatsFromApi = (resourceInfo: NormalizableResourceItem): ResourceInteractStats => {
  const normalized = normalizeResourceItem(resourceInfo);
  const scoreAvg = normalized.scoreAvg ?? null;
  return {
    readCount: normalized.readCount ?? null,
    likeCount: normalized.likeCount ?? null,
    scoreAvgText: scoreAvg != null ? `${scoreAvg.toFixed(1)} 分` : '暂无评分',
  };
};

// 枚举归一化大小写，下游 === 比较与分组 label 生效
const mapSearchHitFromApi = (raw: GlobalSearchApiResponse['list'][number]): SearchHitItem => ({
  ...raw,
  resourceType: normalizeSearchResourceType(raw.resourceType),
  resourceIconType: resolveResourceIconType({
    resourceType: raw.resourceType,
    resourceName: raw.resourceName,
  }),
});

const mapSearchResultPageFromApi = (data: GlobalSearchApiResponse): SearchResultPage => ({
  list: data.list.map(mapSearchHitFromApi),
  total: data.total,
  page: data.page,
  size: data.size,
  totalPage: data.totalPage,
});

export const ResourceServicesMap = {
  mapListResourceItemsRequest,
  mapResourceListPageFromApi,
  mapResourceItemFromApi,
  mapChangeResourceActionPermissionRequest,
  mapLikeStatusFromApi,
  mapRateFromApi,
  mapInteractStatsFromApi,
  mapSearchResultPageFromApi,
};
