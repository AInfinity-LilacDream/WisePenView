import { GROUP_TYPE } from '@/domains/Group';
import { GroupMemberApi } from '@/domains/Group/apis/GroupApi';
import type { GroupQuotaInfo, UserGroupQuota } from '@/domains/Wallet';
import { QuotaServicesMap } from '../mapper/QuotaServices.map';
import type { IQuotaService, SetGroupQuotaRequest } from './index.type';

const GROUP_QUOTA_SCAN_PAGE_SIZE = 100;

const filterAdvancedGroupQuotas = (quotas: UserGroupQuota[]): UserGroupQuota[] =>
  quotas.filter((quota) => quota.groupType === GROUP_TYPE.ADVANCED);

const paginateUserGroupQuotas = (
  quotas: UserGroupQuota[],
  page: number,
  pageSize: number
): { quotas: UserGroupQuota[]; total: number } => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const startIndex = (safePage - 1) * safePageSize;

  return {
    quotas: quotas.slice(startIndex, startIndex + safePageSize),
    total: quotas.length,
  };
};

const fetchAllUserGroupQuotas = async (): Promise<UserGroupQuota[]> => {
  const quotas: UserGroupQuota[] = [];
  let currentPage = 1;
  let rawTotal = 0;

  do {
    const data = await GroupMemberApi.getAllMyGroupTokenInfo({
      page: currentPage,
      size: GROUP_QUOTA_SCAN_PAGE_SIZE,
    });
    const mapped = QuotaServicesMap.mapFetchUserGroupQuotasFromApi(data);
    quotas.push(...mapped.quotas);
    rawTotal = mapped.total;
    currentPage += 1;

    if (mapped.quotas.length === 0) {
      break;
    }
  } while (quotas.length < rawTotal);

  return quotas;
};

/** GET /group/member/getAllMyGroupTokenInfo → PageR<GroupMemberTokenDetailResponse> */
const fetchUserGroupQuotas = async (
  page: number,
  pageSize: number
): Promise<{ quotas: UserGroupQuota[]; total: number }> => {
  const quotas = await fetchAllUserGroupQuotas();
  return paginateUserGroupQuotas(filterAdvancedGroupQuotas(quotas), page, pageSize);
};

const fetchGroupQuota = async (groupId: string | number): Promise<GroupQuotaInfo> => {
  const data = await GroupMemberApi.getMyGroupMemberInfo({ groupId });
  return QuotaServicesMap.mapFetchGroupQuotaFromApi(data);
};

const setGroupQuota = async (params: SetGroupQuotaRequest) => {
  await GroupMemberApi.changeTokenLimit(params);
};

export const createQuotaServices = (): IQuotaService => ({
  fetchUserGroupQuotas,
  fetchGroupQuota,
  setGroupQuota,
});
