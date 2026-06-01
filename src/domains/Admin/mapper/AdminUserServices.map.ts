import type { AdminUser } from '@/domains/Admin';
import { formatTimestampToDateTime } from '@/utils/format/formatTime';
import { normalizeId } from '@/utils/normalize/normalizeId';
import type {
AdminUserApiModel,
AdminUserProfileApiModel,
FetchAdminUserListApiRequest,
FetchAdminUserListApiResponse,
} from '../apis/AdminUserApi.type';
import type { FetchAdminUserListRequest,FetchAdminUserListResponse } from '../service/index.type';

export const mapAdminUserApiModelToEntity = (raw: AdminUserApiModel): AdminUser => {
  return {
    id: normalizeId(raw.id ?? raw.userId),
    username: raw.username ?? '',
    nickname: raw.nickname ?? undefined,
    realName: raw.realName ?? undefined,
    avatar: raw.avatar ?? undefined,
    identityType: raw.identityType ?? 0,
    campusNo: raw.campusNo ?? undefined,
    email: raw.email ?? undefined,
    mobile: raw.mobile ?? undefined,
    verificationMode: raw.verificationMode ?? null,
    status: raw.status ?? 0,
    createTime: formatTimestampToDateTime(raw.createTime),
    updateTime: formatTimestampToDateTime(raw.updateTime),
  };
};

export const mapAdminUserProfileApiModelToEntity = (
  raw: AdminUserProfileApiModel | null | undefined
): Record<string, unknown> | null => {
  if (!raw) return null;

  return {
    ...raw,
    userId: normalizeId(raw.userId),
    createTime: formatTimestampToDateTime(raw.createTime),
    updateTime: formatTimestampToDateTime(raw.updateTime),
  };
};

export const mapFetchAdminUserListRequestToApi = (
  params: FetchAdminUserListRequest
): FetchAdminUserListApiRequest => {
  const keyword = params.keyword?.trim();

  return {
    page: params.page,
    size: params.size,
    ...(keyword ? { keyword } : {}),
    ...(params.status !== undefined ? { status: params.status } : {}),
    ...(params.identityType !== undefined ? { identityType: params.identityType } : {}),
  };
};

export const mapFetchAdminUserListResponse = (
  data: FetchAdminUserListApiResponse
): FetchAdminUserListResponse => ({
  users: data.list.map(mapAdminUserApiModelToEntity),
  total: data.total,
  page: data.page,
  size: data.size,
  totalPage: data.totalPage,
});
