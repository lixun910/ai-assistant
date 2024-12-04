import { AbstractAssistant } from './assistant';
import { Runnable } from '@langchain/core/runnables';
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  ToolMessage,
  trimMessages,
  SystemMessage,
} from '@langchain/core/messages';
import {
  CustomFunctionOutputProps,
  CustomFunctions,
  ProcessImageMessageProps,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
  StreamMessageCallback,
} from '../types';
import { BindToolsInput } from '@langchain/core/language_models/chat_models';
import { ReactNode } from 'react';
import { tiktokenCounter } from '../utils/token-counter';

export class LangChainAssistant extends AbstractAssistant {
  protected static apiKey = '';

  protected static model = '';

  protected static instructions = '';

  protected static temperature = 1.0;

  protected static topP = 0.8;

  protected static description = '';

  protected static maxTokens = 128000;

  protected llm: Runnable | null = null;

  protected messages: BaseMessage[] = [];

  protected static customFunctions: CustomFunctions = {};

  protected static tools: BindToolsInput[] = [];

  protected abortController: AbortController | null = null;

  protected constructor() {
    super();
  }

  protected static checkModel() {
    if (!LangChainAssistant.model || LangChainAssistant.model.trim() === '') {
      throw new Error('LLM is not configured. Please call configure() first.');
    }
  }

  protected static checkApiKey() {
    if (!LangChainAssistant.apiKey || LangChainAssistant.apiKey.trim() === '') {
      throw new Error('LLM is not configured. Please call configure() first.');
    }
  }

  protected static isModelChanged(model?: string) {
    return model && LangChainAssistant.model !== model;
  }

  protected static isApiKeyChanged(apiKey?: string) {
    return apiKey && LangChainAssistant.apiKey !== apiKey;
  }

  public static override configure({
    apiKey,
    model,
    instructions,
    temperature,
    topP,
    description,
    maxTokens,
  }: {
    apiKey?: string;
    model?: string;
    instructions?: string;
    temperature?: number;
    topP?: number;
    description?: string;
    version?: string;
    maxTokens?: number;
  }) {
    if (apiKey) LangChainAssistant.apiKey = apiKey;
    if (model) LangChainAssistant.model = model;
    if (instructions) LangChainAssistant.instructions = instructions;
    if (temperature) LangChainAssistant.temperature = temperature;
    if (topP) LangChainAssistant.topP = topP;
    if (description) LangChainAssistant.description = description;
    if (maxTokens) LangChainAssistant.maxTokens = maxTokens;
  }

  public static override registerFunctionCalling({
    name,
    description,
    properties,
    required,
    callbackFunction,
    callbackFunctionContext,
    callbackMessage,
  }: RegisterFunctionCallingProps) {
    // register custom function, if already registed then rewrite it
    LangChainAssistant.customFunctions[name] = {
      func: callbackFunction,
      context: callbackFunctionContext,
      callbackMessage,
    };

    // add function calling to tools
    LangChainAssistant.tools.push({
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    });
  }

  public override async addAdditionalContext({ context }: { context: string }) {
    // since the context of the conversation is already stored in the messages array,
    // append the context to the first message which is the system message
    this.messages[0] = new SystemMessage(
      `${LangChainAssistant.instructions}\n\n${context}`
    );
  }

  public override stop() {
    if (this.llm && this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public override restart() {
    this.stop();
    this.messages = [];
    // need to reset the llm so getInstance doesn't return the same instance
    this.llm = null;
  }

  protected async trimMessages() {
    return await trimMessages(this.messages, {
      maxTokens: LangChainAssistant.maxTokens,
      strategy: 'last',
      includeSystem: true,
      tokenCounter: tiktokenCounter,
    });
  }

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
    useTool = true,
    message = '',
  }: ProcessMessageProps) {
    if (!this.llm) {
      throw new Error('LLM instance is not initialized');
    }
    if (!this.abortController) {
      this.abortController = new AbortController();
    }

    if (textMessage) {
      this.messages.push(new HumanMessage(textMessage));
    }

    const stream = await this.llm.stream(await this.trimMessages(), {
      signal: this.abortController?.signal,
    });

    let finalChunk: AIMessageChunk | null = null;

    for await (const chunk of stream) {
      finalChunk = finalChunk ? finalChunk.concat(chunk) : chunk;

      if (chunk.content.length > 0 && !Array.isArray(chunk.content)) {
        message += chunk.content.toString();
        streamMessageCallback({ deltaMessage: message });
      }
    }

    let customMessage: ReactNode | null = null;

    if (finalChunk) {
      this.messages.push(finalChunk);

      if (finalChunk.tool_calls && useTool) {
        const toolCallResult = await this.proceedToolCall({
          finalChunk,
          message,
          streamMessageCallback,
        });
        customMessage = toolCallResult.customMessage;
        message = toolCallResult.message;

        // try if there is more than one tool call in the same run
        if (
          finalChunk.tool_calls.length > 0 &&
          (message.length === 0 || toolCallResult.anotherFunctionCall)
        ) {
          this.processTextMessage({
            streamMessageCallback,
            useTool: true,
            message,
          });
        }
      }
    }

    streamMessageCallback({
      deltaMessage: message,
      customMessage,
      isCompleted: true,
    });
  }

  protected async proceedToolCall({
    finalChunk,
    message,
    streamMessageCallback,
  }: {
    finalChunk: AIMessageChunk;
    message: string;
    streamMessageCallback: StreamMessageCallback;
  }) {
    if (!finalChunk.tool_calls || this.llm === null) {
      return { customMessage: null, message };
    }
    const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];
    let customMessage: ReactNode | null = null;
    let anotherFunctionCall = false;
    for (let i = 0; i < finalChunk.tool_calls.length; i++) {
      const toolCall = finalChunk.tool_calls[i];
      const functionName = toolCall?.name;
      const functionArgs = toolCall?.args;
      try {
        const { func, context, callbackMessage } =
          LangChainAssistant.customFunctions[functionName];

        const output = await func({
          functionName,
          functionArgs,
          functionContext: context,
          previousOutput: functionOutput,
        });

        functionOutput.push({
          ...output,
          name: functionName,
          args: functionArgs,
          customMessageCallback: callbackMessage,
        });
      } catch (err) {
        // make sure to return something back to openai when the function execution fails
        functionOutput.push({
          type: 'errorOutput',
          name: functionName,
          args: functionArgs,
          result: {
            success: false,
            details: `The function "${functionName}" is not executed. The error message is: ${err}`,
          },
        });
      }

      // compose output message
      functionOutput.map((output) => {
        const toolMessage = new ToolMessage(
          {
            content: JSON.stringify(output.result),
            id: toolCall.id || '',
            // @ts-expect-error This is for OpenAI tool_call_id. See @langchain/core/messages/tool.ts
            tool_call_id: toolCall.id || '',
          },
          toolCall.id || '',
          toolCall.name
        );

        this.messages.push(toolMessage);
      });
    }

    if (functionOutput.length > 0) {
      const stream = await this.llm.stream(await this.trimMessages(), {
        signal: this.abortController?.signal,
      });
      if (message.length > 0) {
        // add a new line to the message if the message is not empty
        message += '\n\n';
      }
      for await (const chunk of stream) {
        if (Array.isArray(chunk.content)) {
          for (const content of chunk.content) {
            if ('functionCall' in content) {
              anotherFunctionCall = true;
            } else {
              message += content.toString();
            }
          }
        } else {
          message += chunk.content.toString();
        }
        streamMessageCallback({ deltaMessage: message });
      }
      // add custom reponse message from last functionOutput
      const lastOutput = functionOutput[functionOutput.length - 1];
      if (lastOutput.customMessageCallback) {
        customMessage = lastOutput.customMessageCallback({
          functionName: lastOutput.name,
          functionArgs: lastOutput.args || {},
          output: lastOutput,
        });
      }
    }

    return { customMessage, message, anotherFunctionCall };
  }

  public override async processImageMessage({
    imageMessage,
    textMessage,
    streamMessageCallback,
  }: ProcessImageMessageProps): Promise<void> {
    if (!this.llm) {
      throw new Error('LLM instance is not initialized');
    }

    if (!this.abortController) {
      this.abortController = new AbortController();
    }

    const newMessage = new HumanMessage({
      content: [
        {
          type: 'text',
          text: textMessage,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageMessage,
          },
        },
      ],
    });

    // TODO: do we need to add the image message to the messages array as context?
    // this.messages.push(newMessage);

    const stream = await this.llm.stream([newMessage], {
      signal: this.abortController?.signal,
    });

    let message = '';
    const chunks: AIMessageChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
        streamMessageCallback({ deltaMessage: message });
      }
    }

    // let finalChunk = chunks[0];
    // for (const chunk of chunks.slice(1)) {
    //   finalChunk = finalChunk.concat(chunk);
    // }
    // this.messages.push(finalChunk);

    streamMessageCallback({ deltaMessage: message, isCompleted: true });
  }
}
