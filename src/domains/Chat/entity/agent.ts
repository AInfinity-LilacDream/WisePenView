export type ChatAgentType = 'PERSONAL' | 'GROUP';

export interface ChatAgentOption {
  agentId: string;
  agentType: ChatAgentType;
  label: string;
  groupId?: string;
  groupName?: string;
  isDefault?: boolean;
  defaultSkillIds?: string[];
}
