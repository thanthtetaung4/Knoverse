"use client";

import React, { createContext, useContext, useState } from "react";

type MessageSendContextType = {
  messageSend: boolean;
  setMessageSend: (value: boolean) => void;
};

const MessageSendContext = createContext<MessageSendContextType | undefined>(
  undefined
);

export function MessageSendProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messageSend, setMessageSend] = useState<boolean>(false);

  return (
    <MessageSendContext.Provider value={{ messageSend, setMessageSend }}>
      {children}
    </MessageSendContext.Provider>
  );
}

export function useMessageSend() {
  const context = useContext(MessageSendContext);
  if (context === undefined) {
    throw new Error("useMessageSend must be used within MessageSendProvider");
  }
  return context;
}
