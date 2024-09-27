import { OllamaAssistant } from '../llm/ollama';
import { GPTAssistant } from '../llm/chatgpt';
import {
  CallbackFunction,
  CustomFunctionCall,
  CustomFunctionContext,
  CustomMessageCallback,
  StreamMessageCallback,
} from '../types';
import { GoogleAssistant } from '../llm/google';
import { useEffect, useRef, useState } from 'react';

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

let llm: OllamaAssistant | GoogleAssistant | GPTAssistant | null = null;

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
      llm = await AssistantModel.getInstance();

      setApiKeyStatus('success');
    } catch (error) {
      console.log('useAssistant initialization error', error);
      setApiKeyStatus('failed');
    }
  };

  const sendTextMessage = async ({
    message,
    streamMessageCallback,
  }: SendTextMessageProps) => {
    await llm?.processTextMessage({
      textMessage: message,
      streamMessageCallback,
    });
  };

  const sendImageMessage = async ({
    imageBase64String,
    message,
    streamMessageCallback,
  }: SendImageMessageProps) => {
    await llm?.processImageMessage({
      imageMessage: imageBase64String,
      textMessage: message,
      streamMessageCallback,
    });
  };

  const audioToText = async (audioBlob: Blob) => {
    return await llm?.audioToText({ audioBlob });
  };

  const addAdditionalContext = async ({
    context,
    callback,
  }: {
    context: string;
    callback?: () => void;
  }) => {
    await llm?.addAdditionalContext({ context, callback });
  };

  return {
    initializeAssistant,
    sendTextMessage,
    sendImageMessage,
    audioToText,
    addAdditionalContext,
    apiKeyStatus,
  };
};

function GetAssistantModelByProvider(provider: string) {
  switch (provider) {
    case 'openai':
      return GPTAssistant;
    case 'google':
      return GoogleAssistant;
    case 'ollama':
      return OllamaAssistant;
    default:
      return GPTAssistant;
  }
}
