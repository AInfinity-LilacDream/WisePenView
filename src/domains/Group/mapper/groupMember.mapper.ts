import type { GroupMember } from '@/domains/Group';
import { ROLE } from '@/domains/Group';
import { normalizeId } from '@/utils/normalize/normalizeId';
import type { GroupMemberRawResponse } from '../service/index.type';

const normalizeRoleFromApi = (value: unknown): GroupMember['role'] => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return 'MEMBER';
  return ROLE.getKey(numericValue) ?? 'MEMBER';
};

/** OpenAPI GroupMemberDetailResponse -> 领域 GroupMember（userId <- memberId） */
export const mapGroupMemberRawResponse = (raw: GroupMemberRawResponse): GroupMember => ({
  userId: normalizeId(raw.memberId),
  realname: raw.memberInfo.realName ?? '',
  nickname: raw.memberInfo.nickname,
  role: normalizeRoleFromApi(raw.role),
  joinTime: raw.joinTime,
  avatar: raw.memberInfo.avatar ?? '',
  limit: raw.tokenLimit,
  used: raw.tokenUsed,
});
