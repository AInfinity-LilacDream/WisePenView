import { useContext } from 'react';
import { ChatInputFileContext, type ChatInputFileContextValue } from './ChatInputFileContextValue';

export function useChatInputFiles(): ChatInputFileContextValue {
  const context = useContext(ChatInputFileContext);
  if (!context) {
    throw new Error('useChatInputFiles must be used within ChatInputFileProvider');
  }
  return context;
}
