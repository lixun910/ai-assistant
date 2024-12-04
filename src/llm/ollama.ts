import { ChatOllama } from '@langchain/ollama';
import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { LangChainAssistant } from './langchain';
import { ProcessMessageProps } from '../types';

export class OllamaAssistant extends LangChainAssistant {
  private aiModel: ChatOllama | null = null;

  private static baseUrl = 'http://127.0.0.1:11434';

  private static instance: OllamaAssistant | null = null;

  private constructor() {
    super();

    // Initialize Ollama instance
    this.aiModel = new ChatOllama({
      model: OllamaAssistant.model,
      baseUrl: OllamaAssistant.baseUrl,
      temperature: OllamaAssistant.temperature,
      topP: OllamaAssistant.topP,
      streaming: true,
    });

    // add system message from instructions
    this.messages.push(new SystemMessage(OllamaAssistant.instructions));

    // bind tools
    this.llm = this.aiModel.bind({
      tools: OllamaAssistant.tools,
    });
  }

  protected static checkBaseUrl() {
    if (!OllamaAssistant.baseUrl || OllamaAssistant.baseUrl.trim() === '') {
      throw new Error('Base URL is not configured. Please call configure() first.');
    }
  }

  protected static isBaseUrlChanged(baseUrl?: string) {
    return baseUrl && OllamaAssistant.baseUrl !== baseUrl;
  }

  public static async getInstance(): Promise<OllamaAssistant> {
    // check if model and baseUrl are set
    OllamaAssistant.checkBaseUrl();
    LangChainAssistant.checkModel();

    if (OllamaAssistant.instance === null) {
      OllamaAssistant.instance = new OllamaAssistant();
      // NOTE: hack to avoid ollama always using tools
      // const instructions =
      //   'Analyse the given prompt and decided whether or not it can be answered by a tool. If it cannot, please use the model to answer the prompt directly and do not return any tool.';
      // OllamaAssistant.instance.messages.push(new HumanMessage(instructions));
      // OllamaAssistant.instance.messages.push(new AIMessage('Got it.'));
    } else if (
      LangChainAssistant.isModelChanged(
        OllamaAssistant.instance.aiModel?.model
      ) ||
      OllamaAssistant.isBaseUrlChanged(
        OllamaAssistant.instance.aiModel?.baseUrl
      )
    ) {
      // reset the aiModel if the model is changed
      OllamaAssistant.instance.aiModel = new ChatOllama({
        model: OllamaAssistant.model,
        baseUrl: OllamaAssistant.baseUrl,
        temperature: OllamaAssistant.temperature,
        topP: OllamaAssistant.topP,
        streaming: true,
      });
    }

    return OllamaAssistant.instance;
  }

  public override restart() {
    super.restart();
    // need to reset the instance so getInstance doesn't return the same instance
    OllamaAssistant.instance = null;
  }

  public static override configure({
    baseUrl,
    model,
    instructions,
    temperature,
    topP,
    description
  }: {
    baseUrl?: string;
    model?: string;
    instructions?: string;
    temperature?: number;
    topP?: number;
    name?: string;
    description?: string;
    version?: string;
  }) {
    if (baseUrl) OllamaAssistant.baseUrl = baseUrl;
    if (model) LangChainAssistant.model = model;
    if (instructions) LangChainAssistant.instructions = instructions;
    if (temperature) LangChainAssistant.temperature = temperature;
    if (topP) LangChainAssistant.topP = topP;
    if (description) LangChainAssistant.description = description;
    LangChainAssistant.maxTokens = 8192;
  }

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
  }: ProcessMessageProps) {
    if (!this.aiModel) {
      throw new Error('LLM instance is not initialized');
    }

    // get the list of tools, and convert to string
    const tools = OllamaAssistant.tools;
    const toolsString = JSON.stringify(tools);

    // check with ollama if the prompt can be answered by a tool
    const checkMessage = `You have the following tools available\n: ${toolsString}\n. Can you answer the following prompt using one of the function with the correct parameters in the given tools:\n"${textMessage}".\nPlease respond with one of the two words: "Yes" or "No".`;

    const stream = await this.aiModel.stream([new HumanMessage(checkMessage)]);
    const chunks: AIMessageChunk[] = [];
    let message = '';

    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
      }
    }
    const useTool = message.startsWith('Yes') || message.startsWith('"Yes"');

    if (useTool === false) {
      // use ollama model to answer the question directly
      this.messages.push(new HumanMessage(textMessage || ''));
      const trimmedMessages = await this.trimMessages();
      const stream = await this.aiModel.stream(trimmedMessages);
      const chunks: AIMessageChunk[] = [];
      let message = '';

      for await (const chunk of stream) {
        chunks.push(chunk);
        if (chunk.content.length > 0) {
          message += chunk.content.toString();
          streamMessageCallback({ deltaMessage: message });
        }
      }

      // concat all chunks and push to messages
      let finalChunk = chunks[0];
      for (const chunk of chunks.slice(1)) {
        finalChunk = finalChunk.concat(chunk);
      }
      this.messages.push(finalChunk);

      streamMessageCallback({ deltaMessage: message, isCompleted: true });
    } else {
      // use tool
      super.processTextMessage({ textMessage, streamMessageCallback, useTool });
    }
  }
}
