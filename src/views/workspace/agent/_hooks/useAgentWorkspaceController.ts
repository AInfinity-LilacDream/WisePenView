import type { AgentDetail, AgentSpec } from '@/domains/Agent';
import { useState } from 'react';

export type AgentSavePhase = 'clean' | 'dirty' | 'saving' | 'failed';
export interface AgentDraft {
  name: string;
  description: string;
  spec: AgentSpec;
}
const snapshot = (draft: AgentDraft) => JSON.stringify(draft);

export function useAgentWorkspaceController() {
  const [draft, setDraftState] = useState<AgentDraft | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [savePhase, setSavePhase] = useState<AgentSavePhase>('clean');
  const initialize = (agent: AgentDetail) => {
    const next = {
      name: agent.name,
      description: agent.description,
      spec: structuredClone(agent.spec),
    };
    setDraftState(next);
    setSavedSnapshot(snapshot(next));
    setSavePhase('clean');
  };
  const setDraft = (updater: (current: AgentDraft) => AgentDraft) =>
    setDraftState((current) => {
      if (!current) return current;
      const next = updater(current);
      setSavePhase(snapshot(next) === savedSnapshot ? 'clean' : 'dirty');
      return next;
    });
  const markSaving = () => setSavePhase('saving');
  const markFailed = () => setSavePhase('failed');
  const markSaved = (next?: AgentDraft) => {
    const value = next ?? draft;
    if (value) {
      setDraftState(value);
      setSavedSnapshot(snapshot(value));
    }
    setSavePhase('clean');
  };
  const reset = () =>
    setDraftState((current) => {
      if (!current) return current;
      const restored = JSON.parse(savedSnapshot) as AgentDraft;
      setSavePhase('clean');
      return restored;
    });
  return {
    draft,
    savePhase,
    isDirty: savePhase === 'dirty' || savePhase === 'failed',
    initialize,
    setDraft,
    markSaving,
    markFailed,
    markSaved,
    reset,
  };
}
