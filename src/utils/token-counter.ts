import { encodingForModel } from '@langchain/core/utils/tiktoken';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  MessageContent,
  AIMessageChunk,
} from '@langchain/core/messages';

async function strTokenCounter(
  messageContent: MessageContent
): Promise<number> {
  const encoding = await encodingForModel('gpt-4');

  if (typeof messageContent === 'string') {
    return encoding.encode(messageContent).length;
  }

  // Handle array of content
  if (Array.isArray(messageContent)) {
    let totalTokens = 0;

    for (const content of messageContent) {
      if (content.type === 'text') {
        totalTokens += encoding.encode(content.text || '').length;
      } else if ('functionCall' in content) {
        // Handle function calls by counting name and stringified args
        const functionCall = content.functionCall;
        totalTokens += encoding.encode(functionCall.name).length;
        totalTokens += encoding.encode(
          JSON.stringify(functionCall.args)
        ).length;
      }
      // Add other content types as needed
    }

    return totalTokens;
  }

  throw new Error(
    `Unsupported message content ${JSON.stringify(messageContent)}`
  );
}

export async function tiktokenCounter(
  messages: BaseMessage[]
): Promise<number> {
  let numTokens = 3; // every reply is primed with <|start|>assistant<|message|>
  const tokensPerMessage = 3;
  const tokensPerName = 1;

  for (const msg of messages) {
    let role: string;
    if (msg instanceof HumanMessage) {
      role = 'user';
    } else if (msg instanceof AIMessage || msg instanceof AIMessageChunk) {
      role = 'assistant';
    } else if (msg instanceof ToolMessage) {
      role = 'tool';
    } else if (msg instanceof SystemMessage) {
      role = 'system';
    } else {
      throw new Error(`Unsupported message type ${msg.constructor.name}`);
    }

    numTokens +=
      tokensPerMessage +
      (await strTokenCounter(role)) +
      (await strTokenCounter(msg.content));

    if (msg.name) {
      numTokens += tokensPerName + (await strTokenCounter(msg.name));
    }
  }
  return numTokens;
}
