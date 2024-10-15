import { OllamaAssistant } from '../llm/ollama';
import { GPTAssistant } from '../llm/chatgpt';
import {
  CallbackFunction,
  CustomFunctionContext,
  CustomMessageCallback,
  StreamMessageCallback,
} from '../types';
import { GoogleAssistant } from '../llm/google';
import { useState } from 'react';
import { AnthropicAssistant } from '../llm/anthropic';

/**
 * Props for the useAssistant hook.
 */
export interface UseAssistantProps {
  modelProvider: string;
  model: string;
  apiKey: string;
  temperature?: number;
  topP?: number;
  instructions: string;
  functions: {
    name: string;
    description: string;
    properties: {
      [key: string]: {
        type: string; // 'string' | 'number' | 'boolean' | 'array';
        description: string;
      };
    };
    required: string[];
    callbackFunction: CallbackFunction;
    callbackFunctionContext?: CustomFunctionContext<unknown>;
    callbackMessage?: CustomMessageCallback;
  }[];
}

export type SendTextMessageProps = {
  message: string;
  streamMessageCallback: StreamMessageCallback;
};

export type SendImageMessageProps = {
  imageBase64String: string;
  message: string;
  streamMessageCallback: StreamMessageCallback;
};

let assistant: OllamaAssistant | GoogleAssistant | GPTAssistant | null = null;

/**
 * A custom hook for managing an AI assistant.
 * This hook provides functionality to initialize, send messages to, and control an AI assistant.
 * 
 * @param {UseAssistantProps} props - Configuration options for the assistant.
 * @returns {Object} An object containing methods to interact with the assistant and its current status.
 */
export const useAssistant = ({
  modelProvider,
  model,
  apiKey,
  temperature,
  topP,
  instructions,
  functions,
}: UseAssistantProps) => {
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('failed');

  /**
   * Initializes the AI assistant with the provided configuration.
   */
  const initializeAssistant = async () => {
    try {
      const AssistantModel = GetAssistantModelByProvider(modelProvider);

      // configure the assistant model
      AssistantModel.configure({
        model,
        apiKey,
        instructions,
        temperature,
        topP,
        name: 'ai-assistant model',
        description: 'This is ai-assistant model',
        version: `0.0.${Math.floor(Math.random() * 1000)}`,
      });

      // register custom functions
      functions.forEach((func) => {
        AssistantModel.registerFunctionCalling({
          name: func.name,
          description: func.description,
          properties: func.properties,
          required: func.required,
          callbackFunction: func.callbackFunction,
          callbackFunctionContext: func.callbackFunctionContext,
          callbackMessage: func.callbackMessage,
        });
      });

      // initialize the assistant model
      assistant = await AssistantModel.getInstance();

      setApiKeyStatus('success');
    } catch (error) {
      console.log('useAssistant initialization error', error);
      setApiKeyStatus('failed');
    }
  };

  /**
   * Checks if the LLM instance is initialized, and initializes it if not.
   * @throws {Error} If the LLM instance fails to initialize.
   */
  const checkLLMInstance = async () => {
    if (assistant === null) {
      await initializeAssistant();
    }
    if (assistant === null) {
      throw new Error('LLM instance is not initialized');
    }
  };


  /**
   * Stops the current chat processing.
   */
  const stopChat = () => {
    if (assistant) {
      assistant.stop();
    }
  };

  /**
   * Restarts the chat by stopping the current chat and reinitializing the assistant.
   */
  const restartChat = async () => {
    if (assistant) {
      await assistant.restart();
      await initializeAssistant();
    }
  };

  /**
   * Sends a text message to the assistant and processes the response.
   * @param {SendTextMessageProps} props - The message and callback for streaming the response.
   */
  const sendTextMessage = async ({
    message,
    streamMessageCallback,
  }: SendTextMessageProps) => {
    await checkLLMInstance();
    await assistant?.processTextMessage({
      textMessage: message,
      streamMessageCallback,
    });
  };

  /**
   * Sends an image message to the assistant and processes the response.
   * @param {SendImageMessageProps} props - The image data, message, and callback for streaming the response.
   */
  const sendImageMessage = async ({
    imageBase64String,
    message,
    streamMessageCallback,
  }: SendImageMessageProps) => {
    await assistant?.processImageMessage({
      imageMessage: imageBase64String,
      textMessage: message,
      streamMessageCallback,
    });
  };

  /**
   * Converts audio to text using the assistant's capabilities.
   * @param {Blob} audioBlob - The audio data to be converted.
   * @returns {Promise<string>} The transcribed text.
   */
  const audioToText = async (audioBlob: Blob) => {
    return await assistant?.audioToText({ audioBlob });
  };

  /**
   * Adds additional context to the assistant's conversation.
   * @param {Object} params - The context and optional callback.
   */
  const addAdditionalContext = async ({
    context,
    callback,
  }: {
    context: string;
    callback?: () => void;
  }) => {
    await assistant?.addAdditionalContext({ context, callback });
  };

  return {
    initializeAssistant,
    sendTextMessage,
    sendImageMessage,
    audioToText,
    addAdditionalContext,
    stopChat,
    restartChat,
    apiKeyStatus,
  };
};

/**
 * Returns the appropriate Assistant model based on the provider.
 * @param {string} provider - The name of the AI provider.
 * @returns {typeof OllamaAssistant | typeof GoogleAssistant | typeof GPTAssistant} The assistant model class.
 */
function GetAssistantModelByProvider(provider: string) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return GPTAssistant;
    case 'google':
      return GoogleAssistant;
    case 'ollama':
      return OllamaAssistant;
    case 'anthropic':
      return AnthropicAssistant;
    default:
      return GPTAssistant;
  }
}
