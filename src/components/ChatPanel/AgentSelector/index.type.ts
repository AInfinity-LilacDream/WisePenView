import type { ChatAgentOption } from '@/store';

export interface AgentSelectorProps {
  selectedAgent: ChatAgentOption;
  options: ChatAgentOption[];
  onChange: (agent: ChatAgentOption) => void;
  compact?: boolean;
}
