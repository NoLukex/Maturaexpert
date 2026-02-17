import React, { createContext, useState, useContext } from 'react';

interface ChatContextType {
  screenContext: string;
  setScreenContext: (ctx: string) => void;
}

const ChatContext = createContext<ChatContextType>({
  screenContext: '',
  setScreenContext: () => {},
});

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [screenContext, setScreenContext] = useState('');
  return (
    <ChatContext.Provider value={{ screenContext, setScreenContext }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);