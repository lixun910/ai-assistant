import React, { ReactNode, useEffect, useState } from 'react';
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

/**
 * Type of AiAssistantProps.
 * 
 * @param theme - The theme of the assistant.
 * @param welcomeMessage - The welcome message of the assistant.
 * @param historyMessages - The history messages of the assistant.
 * @param ideas - The ideas of the assistant.
 * @param userAvatar - The avatar of the user.
 * @param assistantAvatar - The avatar of the assistant.
 * @param isMessageDraggable - The flag to indicate if the message is draggable.
 * @param enableVoice - The flag to indicate if the voice is enabled.
 * @param enableScreenCapture - The flag to indicate if the screen capture is enabled.
 * @param screenCapturedBase64 - The screen captured base64.
 * @param screenCapturedPrompt - The screen captured prompt.
 * @param onScreenshotClick - The callback function to handle the screenshot click.
 * @param onRemoveScreenshot - The callback function to handle the screenshot remove.
 * @param onFeedback - The callback function to handle the feedback.
 * @param onMessagesUpdated - The callback function to handle the messages updated.
 * @param onRestartChat - The callback function to handle the restart chat.
 * @param fontSize - The font size of the assistant.
 */
export type AiAssistantProps = UseAssistantProps & {
  theme?: 'dark' | 'light';
  welcomeMessage: string;
  historyMessages?: MessageModel[];
  ideas?: { title: string; description: string }[];
  userAvatar?: ReactNode | string;
  assistantAvatar?: ReactNode | string;
  isMessageDraggable?: boolean;
  enableVoice?: boolean;
  enableScreenCapture?: boolean;
  screenCapturedBase64?: string;
  screenCapturedPrompt?: string;
  onScreenshotClick?: () => void;
  onRemoveScreenshot?: () => void;
  onFeedback?: (question: string) => void;
  onMessagesUpdated?: (messages: MessageModel[]) => void;
  onRestartChat?: () => void;
  fontSize?: string;
  botMessageClassName?: string;
  userMessageClassName?: string;
  githubIssueLink?: string;
};

/**
 * Creates a welcome message.
 * @param welcomeMessage - The welcome message.
 * @returns The welcome message.
 */
const createWelcomeMessage = (welcomeMessage: string): MessageModel => ({
  message: welcomeMessage,
  sentTime: 'just now',
  sender: 'assistant',
  direction: 'incoming',
  position: 'first',
});

/**
 * Main AI Assistant component for React applications
 * @component
 * @param {AiAssistantProps} props - The props of the Assistant component. See {@link AiAssistantProps} for more details.
 * @returns {JSX.Element} The rendered AI Assistant component
 * @example
 * ```tsx
 * <AiAssistant 
 *   modelProvider="openai"
 *   model="gpt-4"
 *   apiKey="your-api-key"
 * />
 * ```
 */
export function AiAssistant(props: AiAssistantProps) {
  const [messages, setMessages] = useState<MessageModel[]>(
    props.historyMessages && props.historyMessages.length > 0
      ? props.historyMessages
      : [createWelcomeMessage(props.welcomeMessage)]
  );
  const [isPrompting, setIsPrompting] = useState(false);

  const {
    stopChat,
    restartChat,
    sendTextMessage,
    sendImageMessage,
    audioToText,
  } = useAssistant({
    modelProvider: props.modelProvider,
    model: props.model,
    apiKey: props.apiKey,
    instructions: props.instructions,
    functions: props.functions,
    name: props.name,
    description: props.description,
    version: props.version,
  });

  const isScreenshotAvailable =
    props.screenCapturedBase64?.startsWith('data:image');

  /**
   * Handles sending a message, either as text or image based on the presence of a screenshot.
   * @param {string} message - The message to be sent.
   */
  const onSendMessage = async (message: string) => {
    const messageHandlerProps = {
      newMessage: message,
      messages,
      setMessages,
      setTypingIndicator: setIsPrompting,
      onMessagesUpdated: props.onMessagesUpdated,
    };

    if (isScreenshotAvailable) {
      // Handle image message
      await sendImageMessageHandler({
        ...messageHandlerProps,
        imageBase64String: props.screenCapturedBase64!,
        sendImageMessage,
      });
      // delete the screenshot
      props.onRemoveScreenshot?.();
    } else {
      // Handle text message
      await sendTextMessageHandler({
        ...messageHandlerProps,
        sendTextMessage,
      });
    }
  };

  /**
   * Handles voice messages by converting audio to text.
   * @param {Blob} audioBlob - The audio blob to be converted to text.
   * @returns {Promise<string>} The transcribed text from the audio, or an empty string if transcription fails.
   */
  const onVoiceMessage = async (audioBlob: Blob) => {
    return (await audioToText(audioBlob)) || '';
  };

  /**
   * Stops the currently running chat and updates the message list.
   * This function is called when the user wants to interrupt the ongoing conversation.
   */
  const onStopChat = () => {
    // Set the prompting state to false to indicate that the chat has stopped
    setIsPrompting(false);

    // stop processing
    stopChat();
  };

  const reportQuestion = (messageIndex: number) => {
    // report the message
    const question = messages[messageIndex].message;
    if (props.onFeedback) {
      props.onFeedback(question || '');
    }
  };

  /**
   * Restart the current chat
   */
  const onRestartChat = async () => {
    // set the prompting state to false
    setIsPrompting(false);

    // reset the messages
    setMessages([createWelcomeMessage(props.welcomeMessage)]);

    // restart the assistant
    await restartChat();

    // call the onRestartChat callback
    props.onRestartChat?.();
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
      : props.userAvatar;
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
      <div
        className={`order-1 m-2 flex h-full flex-grow flex-col overflow-y-auto overflow-x-hidden ${
          props.fontSize ?? 'text-small'
        }`}
      >
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
                  data-testid="message-card"
                  avatar={getAvatar(message.direction)}
                  currentAttempt={i === 1 ? 2 : 1}
                  message={messageElement}
                  customMessage={message.payload}
                  messageClassName={
                    message.direction == 'outgoing'
                      ? props.userMessageClassName ??
                        'bg-content3 text-content3-foreground'
                      : props.botMessageClassName ?? 'bg-content2'
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
                  githubIssueLink={props.githubIssueLink}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <PromptInputWithBottomActions
            ideas={props.ideas}
            onSendMessage={onSendMessage}
            onVoiceMessage={onVoiceMessage}
            enableVoice={props.enableVoice}
            enableScreenCapture={props.enableScreenCapture}
            onScreenshotClick={props.onScreenshotClick}
            onRemoveScreenshot={props.onRemoveScreenshot}
            screenCaptured={props.screenCapturedBase64}
            defaultPromptText={props.screenCapturedPrompt}
            status={isPrompting ? 'pending' : 'success'}
            onStopChat={onStopChat}
            onRestartChat={onRestartChat}
            fontSize={props.fontSize}
          />
          <p
            className={`px-2 ${props.fontSize ?? 'text-tiny'} text-default-400`}
          >
            AI can make mistakes. Consider checking information.
          </p>
        </div>
      </div>
    </ChatContainer>
  );
}
