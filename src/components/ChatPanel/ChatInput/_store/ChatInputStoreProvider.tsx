import { type ReactNode, useState } from 'react';
import { ChatInputStoreContext, createChatInputStore } from './ChatInputStore';

export function ChatInputStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createChatInputStore);

  return <ChatInputStoreContext.Provider value={store}>{children}</ChatInputStoreContext.Provider>;
}
