import {
  SendImageMessageProps,
  SendTextMessageProps,
} from '../hooks/use-assistant';
import { MessageModel } from '../types';

export async function sendTextMessageHandler({
  newMessage,
  messages,
  setMessages,
  setTypingIndicator,
  sendTextMessage,
  onMessagesUpdated,
}: {
  newMessage: string;
  messages: MessageModel[];
  setMessages: (value: React.SetStateAction<MessageModel[]>) => void;
  setTypingIndicator: (value: React.SetStateAction<boolean>) => void;
  sendTextMessage: (props: SendTextMessageProps) => Promise<void>;
  onMessagesUpdated?: (messages: MessageModel[]) => void;
}) {
  // set prompting to true, to show typing indicator
  setTypingIndicator(true);

  // add outgoing user input message
  const updatedMesssages: MessageModel[] = [
    ...messages,
    {
      message: newMessage,
      direction: 'outgoing',
      sender: 'user',
      position: 'normal',
    },
  ];
  // add incoming message to show typing indicator for chatbot
  setMessages([
    ...updatedMesssages,
    {
      message: '',
      direction: 'incoming',
      sender: 'assistant',
      position: 'normal',
    },
  ]);
  // send message to AI model
  try {
    // send message to AI model
    await sendTextMessage({
      message: newMessage,
      streamMessageCallback: ({ deltaMessage, customMessage, isCompleted }) => {
        // update the last message with the response
        const newMessages: MessageModel[] = [
          ...updatedMesssages,
          {
            message: deltaMessage,
            direction: 'incoming',
            sender: 'assistant',
            position: 'normal',
            payload: customMessage,
          },
        ];
        setMessages(newMessages);
        if (isCompleted) {
          setTypingIndicator(false);
          if (onMessagesUpdated) {
            onMessagesUpdated(newMessages);
          }
        }
      },
    });
  } catch (error) {
    setTypingIndicator(false);
    const newMessages: MessageModel[] = [
      ...updatedMesssages,
      {
        message: 'Error occured while processing the request: ' + error,
        direction: 'incoming',
        sender: 'Error',
        position: 'normal',
      },
    ];
    setMessages(newMessages);
    if (onMessagesUpdated) {
      onMessagesUpdated(newMessages);
    }
  }
}

export async function sendImageMessageHandler({
  newMessage,
  imageBase64String,
  messages,
  setMessages,
  setTypingIndicator,
  sendImageMessage,
  onMessagesUpdated,
}: {
  newMessage: string;
  imageBase64String: string;
  messages: MessageModel[];
  setMessages: (value: React.SetStateAction<MessageModel[]>) => void;
  setTypingIndicator: (value: React.SetStateAction<boolean>) => void;
  sendImageMessage: (props: SendImageMessageProps) => Promise<void>;
  onMessagesUpdated?: (messages: MessageModel[]) => void;
}) {
  // set prompting to true, to show typing indicator
  setTypingIndicator(true);

  // add outgoing user input message
  const updatedMesssages: MessageModel[] = [
    ...messages,
    {
      message: newMessage,
      direction: 'outgoing',
      sender: 'user',
      position: 'normal',
      payload: imageBase64String,
    },
  ];
  // add incoming message to show typing indicator for chatbot
  setMessages([
    ...updatedMesssages,
    {
      message: '',
      direction: 'incoming',
      sender: 'assistant',
      position: 'normal',
    },
  ]);

  // send message to AI model
  try {
    // send message to AI model
    await sendImageMessage({
      message: newMessage,
      imageBase64String,
      streamMessageCallback: ({ deltaMessage, customMessage, isCompleted }) => {
        // update the last message with the response
        const newMessages: MessageModel[] = [
          ...updatedMesssages,
          {
            message: deltaMessage,
            direction: 'incoming',
            sender: 'assistant',
            position: 'normal',
            payload: customMessage,
          },
        ];
        setMessages(newMessages);
        if (isCompleted) {
          setTypingIndicator(false);
          if (onMessagesUpdated) {
            onMessagesUpdated(newMessages);
          }
        }
      },
    });
  } catch (error) {
    setTypingIndicator(false);
    const newMessages: MessageModel[] = [
      ...updatedMesssages,
      {
        message: 'Error occured while processing the request: ' + error,
        direction: 'incoming',
        sender: 'Error',
        position: 'normal',
      },
    ];
    setMessages(newMessages);
    if (onMessagesUpdated) {
      onMessagesUpdated(newMessages);
    }
  }
}
