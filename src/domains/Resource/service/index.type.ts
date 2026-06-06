/**
 * Resource 相关 API 请求类型
 * 与 resource.openapi.json 对齐
 */

import type {
  ResourceAction,
  ResourceItem,
  ResourceSortBy,
  ResourceSortDir,
  TagQueryLogicMode,
} from '@/domains/Resource';
import type { ResourceInteractStats } from '../mapper/ResourceServices.map';

/** 资源列表分页（与 OpenAPI PageResultResourceItemResponse 一致） */
export interface ResourceListPage {
  list: ResourceItem[];
  total: number;
  page: number;
  size: number;
  totalPage: number;
}

/** ResourceService 接口：供依赖注入使用 */
export interface IResourceService {
  getUserResources(params: GetUserResourcesRequest): Promise<ResourceListPage>;
  getGroupResources(params: GetGroupResourceRequest): Promise<ResourceListPage>;
  renameResource(params: RenameResourceRequest): Promise<void>;
  removeResources(params: RemoveResourcesRequest): Promise<void>;
  updateResourceTags(params: UpdateResourceTagsRequest): Promise<void>;
  updateResourceActionPermission(params: UpdateResourceActionPermissionRequest): Promise<void>;
  /** 获取当前用户点赞状态，供 ResourceLikeButton 薄层调用 */
  getLikeStatus(resourceId: string): Promise<{ liked: boolean }>;
  /** 获取当前用户评分，供 ResourceRating 薄层调用 */
  getRate(resourceId: string): Promise<{ score: number }>;
  /** 点赞 / 取消点赞 */
  interactToggleLike(params: InteractToggleLikeRequest): Promise<void>;
  /** 评分（1–5），支持覆盖 */
  interactRate(params: InteractRateRequest): Promise<void>;
  /** 上报资源阅读（详情页 / 文档预览页进入时调用一次） */
  interactRead(resourceId: string): Promise<void>;
  /** 获取资源聚合互动统计（readCount / likeCount / scoreAvg），供 ResourceInteractBar 自行请求 */
  getInteractStats(resourceId: string): Promise<ResourceInteractStats>;
}

/** 重命名资源请求参数（对齐 OpenAPI ResourceRenameRequest，POST /resource/item/renameRes） */
export interface RenameResourceRequest {
  resourceId: string;
  newName: string;
}

/** 删除资源请求参数（对齐 OpenAPI ResourceRemoveRequest，POST /resource/item/removeResources） */
export interface RemoveResourcesRequest {
  resourceIds: string[];
}

/** 更新资源用户标签（对齐 OpenAPI ResourceUpdateTagsRequest，POST /resource/item/updateTags） */
export interface UpdateResourceTagsRequest {
  resourceId: string;
  tagIds: string[];
  groupId?: string;
}

/** 更新单个资源的动作权限配置 */
export interface UpdateResourceActionPermissionRequest {
  resourceId: string;
  overrideGrantedActions?: ResourceAction[] | null;
  specifiedUsersGrantedActions?: Record<string, ResourceAction[]> | null;
}

/**
 * 获取用户资源列表请求参数（个人所有资源，group 不暴露、强制留空）
 * 对齐 GET /resource/item/list 的 query 参数
 */
export interface GetUserResourcesRequest {
  page: number;
  size: number;
  sortBy: ResourceSortBy;
  sortDir: ResourceSortDir;
  resourceType?: string;
  /** 按标签筛选，传 tagId 列表 */
  tagIds?: string[];
  /** 标签查询逻辑：OR=包含任意，AND=包含全部 */
  tagQueryLogicMode?: TagQueryLogicMode;
}

/** 获取小组资源列表请求参数（groupId 必填） */
export type GetGroupResourceRequest = GetUserResourcesRequest & {
  groupId: string;
};

/** 点赞 / 取消点赞请求参数（对齐 POST /resource/interaction/toggleLike） */
export interface InteractToggleLikeRequest {
  resourceId: string;
}

/** 评分请求参数（对齐 POST /resource/interaction/rate） */
export interface InteractRateRequest {
  resourceId: string;
  /** 1–5 整数，支持覆盖提交 */
  score: number;
}
