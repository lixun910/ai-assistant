import {
  HumanMessage,
  AIMessageChunk,
  ToolMessage,
} from '@langchain/core/messages';
import { OpenAIAssistant } from '../openai';
import { GoogleAssistant } from '../google';
import { GPTAssistant } from '../chatgpt';
import { OllamaAssistant } from '../ollama';
import { LangChainAssistant } from '../langchain';
import { ReactNode } from 'react';
import { CustomFunctionOutputProps } from '../../types';

// mapping name and classes
const assistantClasses = {
  OllamaAssistant: OllamaAssistant,
  OpenAIAssistant: OpenAIAssistant,
  GoogleAssistant: GoogleAssistant,
  GPTAssistant: GPTAssistant,
};

self.onmessage = async (event) => {
  const { textMessage, messages, assistantName } = event.data;

  try {
    const assistant: LangChainAssistant = await assistantClasses[
      assistantName
    ].getInstance();

    if (!assistant.llm) {
      throw new Error('LLM instance is not initialized');
    }

    messages.push(new HumanMessage(textMessage));
    console.log(JSON.stringify(messages));

    let stream = await assistant.llm.stream([new HumanMessage(textMessage)]);
    let chunks: AIMessageChunk[] = [];
    let message = '';

    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
        self.postMessage({ type: 'delta', data: message });
      }
    }

    // concat all chunks to a single chunk as the final chunk
    let finalChunk = chunks[0];
    for (const chunk of chunks.slice(1)) {
      finalChunk = finalChunk.concat(chunk);
    }

    let customMessage: ReactNode | null = null;

    if (finalChunk) {
      messages.push(finalChunk);

      if (finalChunk.tool_calls) {
        const functionOutput = await handleToolCalls(
          finalChunk.tool_calls,
          assistant
        );

        if (functionOutput.length > 0) {
          const stream = await assistant.llm.stream(messages);
          if (message.length > 0) {
            // add a new line to the message if it's not empty
            message += '\n\n';
          }
          for await (const chunk of stream) {
            message += chunk.content.toString();
            self.postMessage({ type: 'delta', data: message });
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

    self.postMessage({ type: 'complete', data: { message, customMessage } });
  } catch (error) {
    console.log(error);
    // if any error occurs, post the error message to the main thread
    self.postMessage({
      type: 'error',
      data: {
        message: 'Something went wrong' + `\n${error}`,
      },
    });
  }
};

async function handleToolCalls(toolCalls, assistant) {
  const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];

  for (const toolCall of toolCalls) {
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
      // if the function execution fails, push an error output to the function output
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
    functionOutput.forEach((output) => {
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
      // push the tool message to the assistant messages
      assistant.messages.push(toolMessage);
    });
  }

  return functionOutput;
}
