export type SkillScopeType = 'PERSONAL' | 'GROUP';

export interface SkillSummary {
  skillId: string;
  displayName: string;
  description?: string;
  currentVersionId?: string;
  scopeType: SkillScopeType;
  groupId?: string;
  groupName?: string;
}
