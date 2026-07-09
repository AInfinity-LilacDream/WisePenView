import type {
  GetAllMyGroupTokenInfoApiResponse,
  GetMyGroupMemberInfoApiResponse,
  GroupTokenInfoApiResponseItem,
} from '@/domains/Group/apis/GroupApi.type';
import type { GroupQuotaInfo, UserGroupQuota } from '@/domains/Wallet';
import { normalizeId } from '@/utils/normalize/normalizeId';

const normalizeNumberFromApi = (value: unknown, fallback = 0): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const mapUserGroupQuotaFromApi = (item: GroupTokenInfoApiResponseItem): UserGroupQuota => {
  const base = item.groupDisplayBase ?? {};

  return {
    groupId: normalizeId(base.groupId),
    groupName: base.groupName ?? '',
    groupType: normalizeNumberFromApi(base.groupType),
    quotaLimit: item.tokenLimit ?? 0,
    quotaUsed: item.tokenUsed ?? 0,
  };
};

const mapFetchUserGroupQuotasFromApi = (
  data: GetAllMyGroupTokenInfoApiResponse
): { quotas: UserGroupQuota[]; total: number } => {
  const rawList = data.list ?? [];
  const quotas = rawList.map(mapUserGroupQuotaFromApi);

  return {
    quotas,
    total: data.total ?? quotas.length,
  };
};

const mapFetchGroupQuotaFromApi = (data: GetMyGroupMemberInfoApiResponse): GroupQuotaInfo => ({
  used: data.tokenUsed ?? 0,
  limit: data.tokenLimit ?? 0,
});

export const QuotaServicesMap = {
  mapFetchUserGroupQuotasFromApi,
  mapFetchGroupQuotaFromApi,
};
