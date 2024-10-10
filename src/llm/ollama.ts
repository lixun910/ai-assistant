import { ChatOllama } from '@langchain/ollama';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { LangChainAssistant } from './langchain';

export class OllamaAssistant extends LangChainAssistant {
  private aiModel: ChatOllama;

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

  public static async getInstance(): Promise<OllamaAssistant> {
    if (OllamaAssistant.instance === null) {
      OllamaAssistant.instance = new OllamaAssistant();
      // NOTE: hack to avoid ollama always using tools
      const instructions =
        'Analyse the given prompt and decided whether or not it can be answered by a tool. If it cannot, please use the model to answer the prompt directly and do not return any tool.';
      OllamaAssistant.instance.messages.push(new HumanMessage(instructions));
      OllamaAssistant.instance.messages.push(new AIMessage('Got it.'));
    }

    return OllamaAssistant.instance;
  }

  public static override async configure({
    baseUrl,
    model,
    instructions,
    temperature,
    topP,
  }: {
    baseUrl?: string;
    model?: string;
    instructions?: string;
    temperature?: number;
    topP?: number;
  }) {
    if (baseUrl) OllamaAssistant.baseUrl = baseUrl;
    if (model) OllamaAssistant.model = model;
    if (instructions) OllamaAssistant.instructions = instructions;
    if (temperature) OllamaAssistant.temperature = temperature;
    if (topP) OllamaAssistant.topP = topP;
  }
}
