import { Mutex } from 'async-mutex';
import {
  CustomFunctionOutputProps,
  CustomFunctions,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
  StreamMessageCallback,
} from '../../types';
import { AbstractAssistant } from '../assistant';

import {
  ChatSession,
  FunctionCall,
  FunctionCallingMode,
  FunctionDeclaration,
  FunctionDeclarationSchemaProperty,
  FunctionDeclarationsTool,
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';

export class GeminiAssistant extends AbstractAssistant {
  private genAI: GoogleGenerativeAI;

  private genModel: GenerativeModel | null = null;

  private chat: ChatSession | null = null;

  private lastMessage: string = '';

  private mutex = new Mutex();

  private static apiKey = '';

  private static model = 'gemini-1.5-flash';

  private static temperature = 1.0;

  private static topP = 1.0;

  private static instructions = '';

  private static functionDeclarations: FunctionDeclaration[] = [];

  private static customFunctions: CustomFunctions = {};

  private static instance: GeminiAssistant | null = null;

  private constructor() {
    super();
    // Initialize Gemini instance
    this.genAI = new GoogleGenerativeAI(GeminiAssistant.apiKey);

    // create gemini model
    this.genModel = this.genAI.getGenerativeModel({
      model: GeminiAssistant.model,
      systemInstruction: GeminiAssistant.instructions,
      generationConfig: {
        candidateCount: 1,
        temperature: GeminiAssistant.temperature,
        topP: GeminiAssistant.topP,
      },
      tools: [{ functionDeclarations: GeminiAssistant.functionDeclarations }],
      toolConfig: {
        functionCallingConfig: {
          // The model decides to predict either a function call or a natural language response.
          mode: FunctionCallingMode.AUTO,
        },
      },
    });

    // create chat
    this.chat = this.genModel.startChat();
  }

  /**
   * Get instance using singleton pattern
   */
  public static async getInstance(): Promise<GeminiAssistant> {
    // check if openAIkey is set
    if (!GeminiAssistant.apiKey) {
      throw new Error(
        'Gemini is not configured. Please call GeminiAssistant.configure() first.'
      );
    }

    if (!GeminiAssistant.instance) {
      // create singleton instance
      GeminiAssistant.instance = new GeminiAssistant();
    }

    return GeminiAssistant.instance;
  }

  public static override configure(props: {
    apiKey: string;
    model: string;
    instructions: string;
    temperature?: number;
    topP?: number;
  }) {
    GeminiAssistant.apiKey = props.apiKey;
    GeminiAssistant.model = props.model;
    GeminiAssistant.temperature = props.temperature || 0.8;
    GeminiAssistant.instructions = props.instructions;
    GeminiAssistant.topP = props.topP || 1.0;
  }

  public static override async registerFunctionCalling({
    name,
    description,
    properties,
    required,
    callbackFunction,
    callbackFunctionContext,
    callbackMessage,
  }: RegisterFunctionCallingProps) {
    // register function declaration in generative model tools
    const geminiFunctionProperties: {
      [key: string]: FunctionDeclarationSchemaProperty;
    } = Object.entries(properties).reduce((acc, [key, value]) => {
      acc[key] = {
        type: value.type,
        description: value.description,
      };
      return acc;
    }, {});

    const fd: FunctionDeclaration = {
      name,
      description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: geminiFunctionProperties,
        required,
      },
    };

    GeminiAssistant.functionDeclarations.push(fd);

    // register custom function
    GeminiAssistant.customFunctions[name] = {
      func: callbackFunction,
      context: callbackFunctionContext,
      callbackMessage,
    };
  }

  public override async close() {
    GeminiAssistant.instance = null;
  }

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
  }: ProcessMessageProps) {
    if (!this.chat) {
      streamMessageCallback({
        deltaMessage:
          'Gemini is not initialized. Please call GeminiAssistant.getInstance() first.',
      });
      return;
    }

    this.lastMessage = '';

    const release = await this.mutex.acquire();

    try {
      // Send the message to the model.
      const result = await this.chat.sendMessageStream(textMessage);

      // Print text as it comes in.
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        this.lastMessage += chunkText;
        streamMessageCallback({ deltaMessage: this.lastMessage});
      }

      const calls = (await result.response).functionCalls();

      if (calls) {
        this.handleFunctionCalls(calls, streamMessageCallback);
      }
    } catch (err) {
      console.log('Error in processTextMessage: ', err);
    } finally {
      release();
    }
  }

  private async handleFunctionCalls(
    calls: FunctionCall[],
    streamMessageCallback: StreamMessageCallback
  ) {
    const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];
    let previousOutput;
    for (const call of calls) {
      const functionName = call.name;
      const functionArgs = call.args as { [key: string]: unknown };
      // Call the executable function named in the function call
      // with the arguments specified in the function call and
      // let it call the hypothetical API.
      try {
        const { func, context, callbackMessage } =
          GeminiAssistant.customFunctions[functionName];

        const output = await func({
          functionName,
          functionArgs,
          functionContext: context,
          previousOutput,
        });
        functionOutput.push({
          ...output,
          name: functionName,
          args: functionArgs,
          customMessageCallback: callbackMessage,
        });
        previousOutput = output;
      } catch (err) {
        // return error to LLM
        functionOutput.push({
          type: 'error',
          name: functionName,
          args: functionArgs,
          result: {
            success: false,
            details: `The function "${functionName}" is failed. The error message is: ${err}`,
          },
        });
      }
    }

    // submit all outputs
    const toolOutputs = functionOutput.map((output) => ({
      functionResponse: {
        name: output.name,
        response: JSON.stringify(output.result),
      },
    }));

    const submitResult = await this.chat?.sendMessageStream(
      JSON.stringify(toolOutputs)
    );

    for await (const chunk of submitResult?.stream || []) {
      const chunkText = chunk.text();
      this.lastMessage += chunkText;
      streamMessageCallback({ deltaMessage: this.lastMessage});
    }
  }
}
