import { AbstractAssistant } from './assistant';
import { Runnable } from '@langchain/core/runnables';
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  ToolMessage,
  AIMessage,
} from '@langchain/core/messages';
import {
  CustomFunctionOutputProps,
  CustomFunctions,
  ProcessImageMessageProps,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
} from '../types';
import { BindToolsInput } from '@langchain/core/language_models/chat_models';
import { ReactNode } from 'react';

export class LangChainAssistant extends AbstractAssistant {
  protected static apiKey = '';

  protected static model = '';

  protected static instructions = '';

  protected static temperature = 1.0;

  protected static topP = 0.8;

  protected static description = '';

  protected llm: Runnable | null = null;

  protected messages: BaseMessage[] = [];

  protected static customFunctions: CustomFunctions = {};

  protected static tools: BindToolsInput[] = [];

  protected constructor() {
    super();
  }

  public static override async configure({
    apiKey,
    model,
    instructions,
    temperature,
    topP
  }: {
    apiKey?: string;
    model?: string;
    instructions?: string;
    temperature?: number;
    topP?: number;
  }) {
    if (apiKey) LangChainAssistant.apiKey = apiKey;
    if (model) LangChainAssistant.model = model;
    if (instructions) LangChainAssistant.instructions = instructions;
    if (temperature) LangChainAssistant.temperature = temperature;
    if (topP) LangChainAssistant.topP = topP;
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
    // check if the function name is already registered
    if (LangChainAssistant.customFunctions[name]) {
      return;
    }
    // register custom function
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
    // we can simply add user message with the context to the messages array
    this.messages.push(new HumanMessage(context));
    // simulate an empty assistant message as a response
    this.messages.push(
      new AIMessage(
        'OK. Data context received. No further action required. No response will be generated.'
      )
    );
  }

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
  }: ProcessMessageProps) {
    if (this.llm === null) {
      throw new Error('LLM instance is not initialized');
    }

    this.messages.push(new HumanMessage(textMessage));

    let stream = await this.llm.stream(this.messages);
    let chunks: AIMessageChunk[] = [];
    let message = '';

    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
        streamMessageCallback({ deltaMessage: message });
      }
    }

    let finalChunk = chunks[0];
    for (const chunk of chunks.slice(1)) {
      finalChunk = finalChunk.concat(chunk);
    }

    let customMessage: ReactNode | null = null;

    if (finalChunk) {
      this.messages.push(finalChunk);

      if (finalChunk.tool_calls) {
        const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];

        for (const toolCall of finalChunk.tool_calls) {
          const functionName = toolCall.name;
          const functionArgs = toolCall.args;
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
                // @ts-ignore This is for OpenAI tool_call_id. See @langchain/core/messages/tool.ts
                tool_call_id: toolCall.id || '',
              },
              toolCall.id || '',
              toolCall.name
            );

            this.messages.push(toolMessage);
          });
        }

        if (functionOutput.length > 0) {
          const stream = await this.llm.stream(this.messages);
          if (message.length > 0) message += '\n\n';
          for await (const chunk of stream) {
            message += chunk.content.toString();
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
      }
    }

    streamMessageCallback({
      deltaMessage: message.length === 0 ? '...' : message,
      customMessage,
      isCompleted: true,
    });
  }

  public override async processImageMessage({
    imageMessage,
    textMessage,
    streamMessageCallback,
  }: ProcessImageMessageProps): Promise<void> {
    if (this.llm === null) {
      throw new Error('LLM instance is not initialized');
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

    this.messages.push(newMessage);

    const stream = await this.llm.stream(this.messages);

    let message = '';
    let chunks: AIMessageChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
        streamMessageCallback({ deltaMessage: message });
      }
    }

    let finalChunk = chunks[0];
    for (const chunk of chunks.slice(1)) {
      finalChunk = finalChunk.concat(chunk);
    }

    this.messages.push(finalChunk);

    streamMessageCallback({ deltaMessage: message, isCompleted: true });
  }
}
