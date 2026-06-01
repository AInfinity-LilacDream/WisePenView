import type { UserVerificationMode } from '@/domains/User/enum';

export interface AdminUserProfileApiModel {
  userId?: string | number | null;
  sex?: number | null;
  university?: string | null;
  college?: string | null;
  major?: string | null;
  className?: string | null;
  enrollmentYear?: string | null;
  degreeLevel?: number | null;
  academicTitle?: string | null;
  createTime?: number | string | null;
  updateTime?: number | string | null;
}

export interface AdminUserApiModel {
  id?: string | number | null;
  userId?: string | number | null;
  username?: string | null;
  nickname?: string | null;
  realName?: string | null;
  avatar?: string | null;
  identityType?: number | null;
  campusNo?: string | null;
  email?: string | null;
  mobile?: string | null;
  verificationMode?: UserVerificationMode | null;
  status?: number | null;
  createTime?: number | string | null;
  updateTime?: number | string | null;
}

export interface FetchAdminUserListApiRequest {
  page: number;
  size: number;
  keyword?: string;
  status?: number;
  identityType?: number;
}

export interface PageR<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPage: number;
}

export type FetchAdminUserListApiResponse = PageR<AdminUserApiModel>;

export interface GetAdminUserInfoApiRequest {
  userId: string;
}

export type GetAdminUserInfoApiResponse = AdminUserProfileApiModel;

export interface ChangeAdminUserInfoApiRequest {
  userId: string;
  nickname?: string;
  realName?: string;
  avatar?: string;
  email?: string | null;
  mobile?: string | null;
  status?: number;
  identityType?: number;
}

export interface ChangeAdminUserProfileApiRequest {
  userId: string;
  sex?: number;
  university?: string | null;
  college?: string;
  major?: string;
  className?: string;
  enrollmentYear?: string;
  degreeLevel?: number;
  academicTitle?: string;
}

export interface ResetAdminUserPasswordApiRequest {
  userId: string;
}
