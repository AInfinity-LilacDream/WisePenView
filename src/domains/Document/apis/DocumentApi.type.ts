import type { ResourceItemApiResponse } from '@/domains/Resource/apis/ResourceApi.type';
import type { UserDisplayBase } from '@/domains/User';
import type { Config } from '@onlyoffice/doceditor-types';

interface GetDocInfoResourceInteractionInfoApiResponse {
  readCount?: number;
  likeCount?: number;
  scoreCount?: number;
  scoreTotal?: number;
  favoriteCount?: number;
  commentCount?: number;
}

interface GetDocInfoResourceInfoApiResponse extends Omit<
  ResourceItemApiResponse,
  'resourceInteractionInfo'
> {
  resourceInteractionInfo?: GetDocInfoResourceInteractionInfoApiResponse;
}

export interface UploadDocApiRequest {
  filename: string;
  extension: string;
  md5: string;
  expectedSize: number;
}

export interface UploadDocApiResponse {
  documentId: string;
  putUrl: string | null;
  callbackHeader: string | null;
  objectKey: string;
  flashUploaded: boolean;
}

export interface DocumentIdApiRequest {
  documentId: string;
}

export interface GetDocInfoApiRequest {
  resourceId: string;
  targetVersion?: number;
}

export interface GetOnlyOfficeEditorConfigApiRequest {
  resourceId: string;
}

export type OnlyOfficeEditorConfig = Config;

export interface OnlyOfficeEditorConfigApiResponse {
  sessionId?: string;
  config?: OnlyOfficeEditorConfig | null;
  documentServerPublicUrl?: string | null;
}

export interface DocumentUploadMetaApiResponse {
  documentName: string;
  uploaderId?: string | number;
  fileType: string;
  size: number;
}

export interface PendingDocumentStatusApiResponse {
  status: string;
  errorMessage?: string | null;
}

export interface DocMetaInfoApiResponse {
  uploadMeta: DocumentUploadMetaApiResponse;
  documentStatus: PendingDocumentStatusApiResponse;
  maxPreviewPages: number | null;
}

export interface DocumentVersionInfoApiResponse extends DocMetaInfoApiResponse {
  version: number;
}

export interface PendingDocItemApiResponse extends DocMetaInfoApiResponse {
  documentId?: string;
}

export type ListPendingDocsApiResponse = PendingDocItemApiResponse[];

export interface GetDocInfoApiResponse {
  resourceInfo: GetDocInfoResourceInfoApiResponse;
  documentVersionInfo?: DocumentVersionInfoApiResponse;
  authorsDisplay?: Record<string, UserDisplayBase> | null;
}
