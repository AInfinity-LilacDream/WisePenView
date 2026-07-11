import type { PageR } from '@/apis/api.type';
import type { TagResourceActionKey } from '@/domains/Tag';
import type { UserDisplayBase } from '@/domains/User';
import type { UserIdentityTypeApiValue } from '@/domains/User/apis/UserApi.type';

type GroupFileOrgLogicApiValue = 'FOLDER' | 'TAG';
type GroupTypeApiValue = 1 | 2 | 3 | '1' | '2' | '3';
type GroupRoleApiValue = '0' | '1' | '2' | '-1';
type GroupResourceActionApiValue = TagResourceActionKey | number | `${number}`;
type GroupResourceActionApiList = GroupResourceActionApiValue[];

export interface ListGroupApiRequest {
  groupRoleFilter: 'JOINED' | 'MANAGED';
  page: number;
  size: number;
}

export interface GroupApiResponse {
  groupId?: string | number | null;
  groupName?: string | null;
  groupDesc?: string | null;
  groupCoverUrl?: string | null;
  groupType?: GroupTypeApiValue;
  ownerId?: string | number | null;
  ownerInfo?:
    (Omit<UserDisplayBase, 'identityType'> & { identityType?: UserIdentityTypeApiValue }) | null;
  memberCount?: number;
  createTime?: string;
  inviteCode?: string | null;
  tokenUsed?: number;
  tokenBalance?: number;
}

export type ListGroupApiResponse = PageR<GroupApiResponse>;

export interface GetGroupInfoApiRequest {
  groupId: string;
}

export type GetGroupInfoApiResponse = GroupApiResponse;
export type GetGroupBaseInfoApiRequest = GetGroupInfoApiRequest;
export type GetGroupBaseInfoApiResponse = GroupApiResponse;
export type AddGroupApiRequest = {
  groupName: string;
  groupType: string;
  groupDesc: string;
  groupCoverUrl?: string;
};
export type AddGroupApiResponse = string | number;
export type ChangeGroupApiRequest = {
  groupId: string;
  groupName: string;
  groupDesc: string;
  groupCoverUrl: string;
  groupType: string;
};
export interface RemoveGroupApiRequest {
  groupId: string;
}

export interface GetGroupConfigApiRequest {
  groupId: string;
}

export interface GetGroupConfigApiResponse {
  groupId?: string;
  fileOrgLogic?: GroupFileOrgLogicApiValue;
  defaultMemberActions?: GroupResourceActionApiList;
}

export interface ChangeGroupConfigApiRequest {
  groupId: string;
  fileOrgLogic: GroupFileOrgLogicApiValue;
  defaultMemberActions?: TagResourceActionKey[];
}

export interface JoinGroupApiRequest {
  inviteCode: string;
}

export interface GroupMemberBaseInfo {
  nickname: string;
  realName: string | null;
  avatar: string | null;
  identityType: UserIdentityTypeApiValue;
}

export interface GroupMemberRawResponse {
  role: GroupRoleApiValue;
  joinTime: string;
  tokenLimit: number;
  tokenUsed: number;
  groupId: string | number;
  memberId: string | number;
  memberInfo: GroupMemberBaseInfo;
}

export type FetchGroupMembersApiResponse = PageR<GroupMemberRawResponse>;

export interface ListMemberApiRequest {
  groupId: string | number;
  page: number;
  size: number;
}

export type GroupRoleApiResponse = GroupRoleApiValue;

export interface QuitGroupApiRequest {
  groupId: string;
}

export interface ChangeRoleApiRequest {
  groupId: string;
  targetUserIds: string[];
  role: string;
}

export interface KickMemberApiRequest {
  groupId: string;
  targetUserIds: string[];
}

export interface GetMyGroupMemberInfoApiRequest {
  groupId: string | number;
}

export interface GetMyGroupMemberInfoApiResponse {
  role?: GroupRoleApiValue;
  joinTime?: string;
  tokenUsed?: number;
  tokenLimit?: number;
  groupId?: string | number;
  memberId?: string | number;
  memberInfo?: GroupMemberBaseInfo;
}

export interface ChangeTokenLimitApiRequest {
  groupId: string;
  targetUserIds: string[];
  newTokenLimit: number;
}

export interface GetAllMyGroupTokenInfoApiRequest {
  page: number;
  size: number;
}

export interface GroupTokenInfoApiResponseItem {
  groupDisplayBase?: {
    groupId?: string | number;
    groupName?: string;
    groupType?: GroupTypeApiValue | null;
  };
  tokenLimit?: number;
  tokenUsed?: number;
}

export type GetAllMyGroupTokenInfoApiResponse = PageR<GroupTokenInfoApiResponseItem>;
