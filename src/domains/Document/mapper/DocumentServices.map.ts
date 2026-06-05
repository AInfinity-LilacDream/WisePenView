import { normalizeResourceItem } from '@/utils/normalize/normalizeResourceItem';
import type { GetDocInfoApiResponse, ListPendingDocsApiResponse } from '../apis/DocumentApi.type';
import type { DocDisplayInfoResponse, PendingDocItem } from '../service/index.type';

const mapListPendingDocsFromApi = (data: ListPendingDocsApiResponse | null): PendingDocItem[] => {
  // 兼容：旧实现可能返回 null
  return data ?? [];
};

const mapGetDocInfoFromApi = (data: GetDocInfoApiResponse): DocDisplayInfoResponse => ({
  ...data,
  resourceInfo: normalizeResourceItem(data.resourceInfo),
});

export const DocumentServicesMap = {
  mapListPendingDocsFromApi,
  mapGetDocInfoFromApi,
};
