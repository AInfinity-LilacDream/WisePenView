import { ResourceServicesMap } from '@/domains/Resource/mapper/ResourceServices.map';
import { normalizeUserDisplayBaseFromApi } from '@/domains/User/mapper/userEnum.mapper';
import { normalizeId } from '@/utils/normalize/normalizeId';
import type {
  DocMetaInfoApiResponse,
  GetDocInfoApiResponse,
  ListPendingDocsApiResponse,
  PendingDocItemApiResponse,
} from '../apis/DocumentApi.type';
import type { DocDisplayInfoResponse, DocMetaInfo, PendingDocItem } from '../service/index.type';

const normalizeOptionalId = (value: string | number | null | undefined): string | null => {
  const normalized = normalizeId(value);
  return normalized || null;
};

const mapDocMetaInfoFromApi = (
  data: DocMetaInfoApiResponse & { version?: number }
): DocMetaInfo => ({
  ...data,
  uploadMeta: {
    ...data.uploadMeta,
    uploaderId: normalizeOptionalId(data.uploadMeta.uploaderId),
    size: data.uploadMeta.size,
  },
});

const mapPendingDocItemFromApi = (item: PendingDocItemApiResponse): PendingDocItem => ({
  ...item,
  ...mapDocMetaInfoFromApi(item),
});

const mapListPendingDocsFromApi = (data: ListPendingDocsApiResponse): PendingDocItem[] =>
  data.map(mapPendingDocItemFromApi);

const readDocumentVersionInfoFromApi = (
  data: GetDocInfoApiResponse
): DocMetaInfoApiResponse & { version?: number } => {
  if (data.documentVersionInfo == null) {
    throw new Error('文档版本信息为空');
  }
  return data.documentVersionInfo;
};

const mapGetDocInfoFromApi = (data: GetDocInfoApiResponse): DocDisplayInfoResponse => ({
  docMetaInfo: mapDocMetaInfoFromApi(readDocumentVersionInfoFromApi(data)),
  resourceInfo: ResourceServicesMap.mapResourceItemFromApi(data.resourceInfo),
  authorsDisplay: data.authorsDisplay
    ? Object.fromEntries(
        Object.entries(data.authorsDisplay).flatMap(([userId, userInfo]) => {
          const normalized = normalizeUserDisplayBaseFromApi(userInfo);
          return normalized ? [[userId, normalized] as const] : [];
        })
      )
    : undefined,
});

export const DocumentServicesMap = {
  mapListPendingDocsFromApi,
  mapGetDocInfoFromApi,
};
