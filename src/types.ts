import { ReactNode } from 'react';

/**
 * Type of image message content
 */
export interface MessageImageContentProps {
  src?: string;
  width?: string | number;
  height?: string | number;
  alt?: string;
}

/**
 * Type of message direction
 */
export type MessageDirection = 'incoming' | 'outgoing' | 0 | 1;

/**
 * Type of message type
 */
export type MessageType = 'html' | 'text' | 'image' | 'custom';

/**
 * Type of message content
 */
export type MessagePayload =
  | string
  | Record<string, unknown>
  | MessageImageContentProps
  | ReactNode;

/**
 * Type of Message model
 *
 * @param message The message to be sent
 * @param sentTime The time the message was sent
 * @param sender The sender of the message
 * @param direction The direction of the message
 * @param position The position of the message
 * @param type The type of the message
 * @param payload The payload of the message, can be string, object, image or custom
 */
export interface MessageModel {
  message?: string;
  sentTime?: string;
  sender?: string;
  direction: MessageDirection;
  position: 'single' | 'first' | 'normal' | 'last' | 0 | 1 | 2 | 3;
  type?: MessageType;
  payload?: MessagePayload;
}

/**
 * Type of Custom function output props
 * 
 * @param type The type of the function, e.g. plot, map, table etc.
 * @param name The name of the function, e.g. createMap, createPlot etc.
 * @param args The args of the function, e.g. {datasetId: '123', variable: 'income'}
 * @param isIntermediate Flag indicate if the custom function is a intermediate step
 * @param result The result of the function run, it will be sent back to LLM as response of function calling
 * @param data The data of the function run, it will be used by customMessageCallback() to create the custom message e.g. plot, map etc.
 * @param customMessageCallback The callback function to create custom message e.g. plot/map if needed
 */
export type CustomFunctionOutputProps<R, D> = {
  type: string;
  name: string;
  args?: Record<string, unknown>;
  isIntermediate?: boolean;
  result: R;
  data?: D;
  customMessageCallback?: CustomMessageCallback;
};

export type CallbackFunction = (props: {
  functionName: string,
  functionArgs: { [key: string]: unknown },
  functionContext?: CustomFunctionContext | CustomFunctionContextCallback,
  previousOutput?: CustomFunctionOutputProps<unknown, unknown>[]
}) =>
  | CustomFunctionOutputProps<unknown, unknown>
  | Promise<CustomFunctionOutputProps<unknown, unknown>>;

/**
 * Type of Custom functions, a dictionary of functions e.g. createMap, createPlot etc.
 * key is the name of the function, value is the function itself.
 *
 * The function should return a CustomFunctionOutputProps object, or a Promise of CustomFunctionOutputProps object if it is a async function.
 */
export type CustomFunctions = {
  [key: string]: {
    func: CallbackFunction;
    context?: CustomFunctionContext | CustomFunctionContextCallback;
    callbackMessage?: CustomMessageCallback;
  };
};

/**
 * Type of CustomFunctionCall
 *
 */
export type CustomFunctionCall = {
  /** the name of the function */
  functionName: string;
  /** the arguments of the function */
  functionArgs: Record<string, unknown>;
  /** the output of function execution */
  output: CustomFunctionOutputProps<unknown, unknown>;
};

/**
 * Type of CustomMessageCallback
 *
 * @param customFunctionCall The custom function call
 */
export type CustomMessageCallback = (
  customFunctionCall: CustomFunctionCall
) => MessageModel | null;

/**
 * Context objects for custom functions
 */
export type CustomFunctionContext = {
  [key: string]: unknown;
};

export type CustomFunctionContextCallback = () => CustomFunctionContext;
/**
 * Type of StreamMessageCallback
 *
 * @param deltaMessage The delta message from the assistant
 * @param customMessage The custom message from the custom function
 * @param isCompleted The flag to indicate if the message is completed
 */
export type StreamMessageCallback = (props: {
  deltaMessage: string;
  customMessage?: MessagePayload;
  isCompleted?: boolean;
}) => void;

export type UserActionProps = {
  role: string;
  text: string;
};

/**
 * Type of ProcessMessageProps
 */
export type ProcessMessageProps = {
  textMessage: string;
  imageMessage?: string;
  userActions?: UserActionProps[];
  streamMessageCallback: StreamMessageCallback;
};

/**
 * Type of ProcessImageMessageProps
 *
 * @param imageMessage The image message to be processed
 * @param textMessage The text message to be processed
 * @param streamMessageCallback The stream message callback to stream the message back to the UI
 */
export type ProcessImageMessageProps = {
  imageMessage: string;
  textMessage: string;
  streamMessageCallback: StreamMessageCallback;
};

export type RegisterFunctionCallingProps = {
  name: string;
  description: string;
  properties: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array';
      description: string;
    };
  };
  required: string[];
  callbackFunction: CallbackFunction;
  callbackFunctionContext?: CustomFunctionContext;
  callbackMessage?: CustomMessageCallback;
};

export type OpenAIConfigProps = {
  apiKey: string;
  model: string;
  temperature?: number;
  top_p?: number;
  name: string;
  description: string;
  instructions: string;
  version?: string;
};
