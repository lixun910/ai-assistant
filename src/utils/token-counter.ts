import { encodingForModel } from '@langchain/core/utils/tiktoken';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  MessageContent,
  MessageContentText,
} from '@langchain/core/messages';

async function strTokenCounter(
  messageContent: MessageContent
): Promise<number> {
  if (typeof messageContent === 'string') {
    return (await encodingForModel('gpt-4')).encode(messageContent).length;
  } else {
    if (messageContent.every((x) => x.type === 'text' && x.text)) {
      return (await encodingForModel('gpt-4')).encode(
        (messageContent as MessageContentText[])
          .map(({ text }) => text)
          .join('')
      ).length;
    }
    throw new Error(
      `Unsupported message content ${JSON.stringify(messageContent)}`
    );
  }
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
    } else if (msg instanceof AIMessage) {
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
