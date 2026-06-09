import type { Model } from '@/components/ChatPanel/index.type';
import type { SkillScopeTreeGroup } from '@/domains/Chat/mapper/skillScope.mapper';
import type { SkillSummary } from '@/domains/Resource';
import type { ChatAgentOption } from '@/store';

export interface ChatInputProps {
  onSend: (text: string, opts?: SendOptions) => void | Promise<void>;
  sending: boolean;
  currentModelId: string;
  onModelChange: (model: Model) => void;
  hasSelectedContext: boolean;
  selectedContextText: string;
  onClearSelectedContext: () => void;
  selectedAgent: ChatAgentOption | null;
  primarySkills: SkillSummary[];
  advancedMode: boolean;
  advancedSkillGroups: SkillScopeTreeGroup[];
  currentModelVision: boolean;
}

export interface PendingImagePayload {
  mimeType: string;
  base64: string;
  filename?: string;
}

export interface SendOptions {
  pendingImages?: PendingImagePayload[];
}
