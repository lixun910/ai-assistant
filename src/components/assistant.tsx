import { ReactNode, useEffect, useState } from 'react';
import { MessageModel } from '../types';
import MessageCard from './message-card';
import PromptInputWithBottomActions from './prompt-input-with-bottom-actions';
import { ChatContainer } from './chat-container';
import { useAssistant, UseAssistantProps } from '../hooks/use-assistant';
import { Icon } from '@iconify/react';
import {
  sendImageMessageHandler,
  sendTextMessageHandler,
} from './assistant-utils';

export type AiAssistantProps = UseAssistantProps & {
  theme?: 'dark' | 'light';
  welcomeMessage: string;
  historyMessages?: MessageModel[];
  userAvatar?: ReactNode | string;
  assistantAvatar?: ReactNode | string;
  isMessageDraggable?: boolean;
  screenCapturedBase64?: string;
  onScreenshotClick?: () => void;
  onRemoveScreenshot?: () => void;
  onFeedback?: (question: string) => void;
  onMessagesUpdated?: (messages: MessageModel[]) => void;
};

export function AiAssistant(props: AiAssistantProps) {
  const [messages, setMessages] = useState<MessageModel[]>(
    props.historyMessages && props.historyMessages.length > 0
      ? props.historyMessages
      : [
          {
            message: props.welcomeMessage,
            sentTime: 'just now',
            sender: 'assistant',
            direction: 'incoming',
            position: 'first',
          },
        ]
  );
  const [isPrompting, setIsPrompting] = useState(false);

  const {
    initializeAssistant,
    sendTextMessage,
    sendImageMessage,
    audioToText,
  } = useAssistant({
    modelProvider: props.modelProvider,
    model: props.model,
    apiKey: props.apiKey,
    instructions: props.instructions,
    functions: props.functions,
  });

  const onSendMessage = async (message: string) => {
    if (
      props.screenCapturedBase64 &&
      props.screenCapturedBase64.startsWith('data:image')
    ) {
      sendImageMessageHandler({
        newMessage: message,
        imageBase64String: props.screenCapturedBase64,
        messages,
        setMessages,
        setTypingIndicator: setIsPrompting,
        sendImageMessage,
        onMessagesUpdated: props.onMessagesUpdated,
      });
    } else {
      sendTextMessageHandler({
        newMessage: message,
        messages,
        setMessages,
        setTypingIndicator: setIsPrompting,
        sendTextMessage,
        onMessagesUpdated: props.onMessagesUpdated,
      });
    }
  };

  const onVoiceMessage = async (audioBlob: Blob) => {
    return (await audioToText(audioBlob)) || '';
  };

  const stopRunningChat = () => {
    setIsPrompting(false);
    setMessages([
      ...messages.slice(0, messages.length - 1),
      {
        message: messages[messages.length - 1].message,
        direction: 'incoming',
        sender: 'Error',
        position: 'normal',
      },
    ]);
  };

  const reportQuestion = (messageIndex: number) => {
    // report the message
    const question = messages[messageIndex].message;
    if (props.onFeedback) {
      props.onFeedback(question || '');
    }
  };

  // scroll to bottom when new message is added
  useEffect(() => {
    // hack to scroll to bottom
    const element = document.getElementById('chat-message-list');
    if (element?.firstElementChild) {
      element.scrollTop = element.firstElementChild.scrollHeight + 100;
    }
  }, [messages]);

  const getAvatar = (direction: string | number) => {
    return direction === 'incoming'
      ? props.assistantAvatar || (
          <Icon icon="gravity-ui:face-robot" width="16" />
        )
      : props.userAvatar || 'https://images.unsplash.com/broken';
  };

  const onMessageDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
    message: string
  ) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        id: `message-${index}`,
        type: 'text',
        message,
      })
    );
  };

  return (
    <ChatContainer theme={props.theme || 'light'}>
      <div className="order-1 m-2 flex h-full flex-grow flex-col overflow-y-auto overflow-x-hidden">
        <div
          className="relative flex h-full flex-col gap-4 overflow-y-auto overflow-x-hidden px-1"
          id="chat-message-list"
        >
          <div className="overscroll-behavior-y-auto overflow-anchor-auto touch-action-none absolute bottom-0 left-0 right-0 top-0 flex h-full flex-col gap-4 px-1">
            {messages.map((message, i) => {
              const messageElement = message.message as string;
              return (
                <MessageCard
                  key={i}
                  index={i}
                  avatar={getAvatar(message.direction)}
                  currentAttempt={i === 1 ? 2 : 1}
                  message={messageElement}
                  customMessage={message.payload}
                  messageClassName={
                    message.direction == 'outgoing'
                      ? 'bg-content3 text-content3-foreground'
                      : ''
                  }
                  showFeedback={message.direction === 'incoming'}
                  status={
                    isPrompting && i === messages.length - 1
                      ? 'pending'
                      : message.sender === 'Error'
                      ? 'failed'
                      : 'success'
                  }
                  onFeedback={reportQuestion}
                  draggable={props.isMessageDraggable || false}
                  unselectable="on"
                  onDragStart={(e) => onMessageDragStart(e, i, messageElement)}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <PromptInputWithBottomActions
            onSendMessage={onSendMessage}
            onVoiceMessage={onVoiceMessage}
            onScreenshotClick={props.onScreenshotClick}
            onRemoveScreenshot={props.onRemoveScreenshot}
            screenCaptured={props.screenCapturedBase64}
            status={isPrompting ? 'pending' : 'success'}
            onStopChat={stopRunningChat}
          />
          <p className="px-2 text-tiny text-default-400">
            AI can make mistakes. Consider checking information.
          </p>
        </div>
      </div>
    </ChatContainer>
  );
}
